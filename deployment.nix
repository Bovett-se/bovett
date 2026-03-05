{ nixpkgs, disko, ... }: 
let
  system = "x86_64-linux";
  
  appIp = "0.0.0.0";
  cacheIp = "0.0.0.0";

  # REPLACE THIS WITH YOUR ACTUAL PUBLIC KEY (.pub file contents)
  cachePk = "ssh-rsa ...";
  appPk = "ssh-rsa ...";
  myPublicKey = "ssh-rsa ...";

  # ---------------------------------------------------------
  # The Generic VPS Disk Layout (Hybrid UEFI/BIOS compatibility)
  # ---------------------------------------------------------
  baseDiskoConfig = device: {
    disko.devices.disk.main = {
      type = "disk";
      inherit device;
      content = {
        type = "gpt";
        partitions = {
          boot = {
            size = "1M";
            type = "EF02"; # For Legacy BIOS Grub
          };
          ESP = {
            size = "512M";
            type = "EF00"; # For UEFI Boot
            content = {
              type = "filesystem";
              format = "vfat";
              mountpoint = "/boot";
            };
          };
          root = {
            size = "100%";
            content = {
              type = "filesystem";
              format = "ext4";
              mountpoint = "/";
            };
          };
        };
      };
    };
  };

  # ---------------------------------------------------------
  # Base Server Configuration (Shared across both nodes)
  # ---------------------------------------------------------
  sharedConfig = { modulesPath, ... }: {
    imports = [ (modulesPath + "/profiles/qemu-guest.nix") ]; # Optimizes for VPS hypervisors
    
    boot.loader.grub = {
      enable = true;
      efiSupport = true;
      efiInstallAsRemovable = true;
    };

    services.openssh.enable = true;
    # CRITICAL: This ensures you can actually log in after the wipe
    users.users.root = {
      openssh.authorizedKeys.keys = [ cachePk appPk myPublicKey ];
    };
    
    nix.settings.experimental-features = [ "nix-command" "flakes" ];
    system.stateVersion = "25.11";
  };

in {
  nixosConfigurations = {
    
    # ==========================================
    # NODE 1: The Dedicated Cache Server
    # ==========================================
    cache-server = nixpkgs.lib.nixosSystem {
      inherit system;
      modules = [
        disko.nixosModules.disko
        (baseDiskoConfig "/dev/vda")
        sharedConfig
        ({ pkgs, ... }: {
          networking.hostName = "cache-server";
          
          services.memcached = {
            enable = true;
            listen = "0.0.0.0"; 
            maxMemory = 64; 
          };

          networking.firewall.extraCommands = ''
            iptables -A INPUT -p tcp -s ${appIp} --dport 11211 -j ACCEPT
            iptables -A INPUT -p tcp --dport 11211 -j DROP
          '';
        })
      ];
    };

    # ==========================================
    # NODE 2: The Svelte Web Server
    # ==========================================
    app-server = nixpkgs.lib.nixosSystem {
      inherit system;
      modules = [
        disko.nixosModules.disko
        (baseDiskoConfig "/dev/vda") # CHANGE TO /dev/vda IF NEEDED
        sharedConfig
        ({ pkgs, ... }: {
          networking.hostName = "app-server";

          security.acme.acceptTerms = true;
          security.acme.defaults.email = "admin@bovett.se";

          services.nginx = {
            enable = true;
            recommendedProxySettings = true;
            recommendedTlsSettings = true;
            virtualHosts."bovett.se" = {
              enableACME = true; 
              forceSSL = true;   
              locations."/".proxyPass = "http://127.0.0.1:3000";
            };
          };

          systemd.services.bovett-app = {
            description = "Bovett Svelte Web App";
            wantedBy = [ "multi-user.target" ];
            environment = {
              PORT = "3000";
              MEMCACHED_URL = "${cacheIp}:11211";
              NODE_ENV = "production";
            };
            serviceConfig = {
              ExecStart = "${pkgs.nodejs_24}/bin/node /var/www/bovett/build/index.js";
              DynamicUser = true; 
              Restart = "always";
            };
          };

          swapDevices = [ { device = "/swapfile"; size = 2048; } ];
          nix.gc = {
            automatic = true;
            dates = "daily";
            options = "--delete-older-than 3d";
          };
          nix.settings.auto-optimise-store = true;
          networking.firewall.allowedTCPPorts = [ 80 443 ];
        })
      ];
    };
  };
}
