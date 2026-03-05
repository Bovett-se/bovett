<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import { themeState } from '$lib/theme.svelte';
  import { t } from 'svelte-i18n';

  Chart.register(...registerables);

  let {
    loanAmount = 0,
    interestRate = 0,
    additionalInterestRates = [],
    loanTranches = [],
    monthlyAmortization = 0,
    monthlyOperating = 0,
    monthlyFee = 0,
    monthlyPropertyTax = 0
  } = $props<{
    loanAmount: number;
    interestRate: number;
    additionalInterestRates: number[];
    loanTranches: {
      id: string;
      percentage: number;
      rate: number;
      period: string;
      amortization?: number;
    }[];
    monthlyAmortization: number;
    monthlyOperating: number;
    monthlyFee: number;
    monthlyPropertyTax: number;
  }>();

  let canvas = $state<HTMLCanvasElement | null>(null);
  let chart = $state<Chart<'line'> | null>(null);
  let isDark = $derived(themeState.isDark);

  function getChartData() {
    const labels = [];
    const isAdvanced = loanTranches && loanTranches.length > 1;

    // Manual stack order (Top to Bottom):
    // Interest Tranches (if advanced) or Total Interest
    // Amortization
    // Fixed Costs
    const years = 30;
    const fixedMonthly = monthlyOperating + monthlyFee + monthlyPropertyTax;
    const amortizationMonthly = monthlyAmortization;

    // Initialize stacks
    const stack_Fixed: number[] = [];
    const stack_Amort: number[] = [];
    const trancheStacks: number[][] = isAdvanced ? loanTranches.map(() => []) : [[]]; // If not advanced, one stack for main interest

    const additionalLines: { label: string; data: number[] }[] = additionalInterestRates.map(
      (r: number) => ({
        label: `${$t('scenario.totalMonthly')} (${r}% ${$t('scenario.withInterestRate')})`,
        data: []
      })
    );

    const initialTrancheLoans = isAdvanced
      ? loanTranches.map((t) => loanAmount * (t.percentage / 100))
      : [loanAmount];

    for (let i = 0; i <= years; i++) {
      if (i % 5 === 0 || i === 0 || i === years) {
        labels.push(`${i} year`);
      } else {
        labels.push('');
      }

      const currentTrancheRemaining = initialTrancheLoans.map((initial, idx) => {
        const amort = isAdvanced ? loanTranches[idx].amortization || 0 : amortizationMonthly;
        return Math.max(0, initial - amort * 12 * i);
      });

      const totalRemainingLoan = currentTrancheRemaining.reduce((a, b) => a + b, 0);

      stack_Fixed.push(fixedMonthly);
      const valAmort = fixedMonthly + amortizationMonthly;
      stack_Amort.push(valAmort);

      let currentStackTotal = valAmort;

      if (isAdvanced) {
        loanTranches.forEach((tranche, idx) => {
          const trancheInterest = (currentTrancheRemaining[idx] * (tranche.rate / 100)) / 12;
          currentStackTotal += trancheInterest;
          trancheStacks[idx].push(currentStackTotal);
        });
      } else {
        const mainInterestMonthly = (totalRemainingLoan * (interestRate / 100)) / 12;
        currentStackTotal += mainInterestMonthly;
        trancheStacks[0].push(currentStackTotal);
      }

      additionalInterestRates.forEach((rate: number, idx: number) => {
        const altInterestMonthly = (totalRemainingLoan * (rate / 100)) / 12;
        const totalMonthly = altInterestMonthly + amortizationMonthly + fixedMonthly;
        additionalLines[idx].data.push(totalMonthly);
      });
    }

    const datasets: any[] = [];

    // Comparison lines go first
    additionalLines.forEach((line, idx) => {
      const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];
      const color = colors[idx % colors.length];
      datasets.push({
        label: line.label,
        data: line.data,
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        tension: 0.1,
        order: 1
      });
    });

    // Tranches (Top-most layers)
    const trancheColors = isDark
      ? ['#2dd4bf', '#14b8a6', '#0d9488', '#0f766e']
      : ['#14b8a6', '#0d9488', '#0f766e', '#134e4a'];

    for (let i = trancheStacks.length - 1; i >= 0; i--) {
      const trancheLabel = isAdvanced
        ? `${$t('scenario.interestLabel')} ${i + 1} (${loanTranches[i].percentage}%)`
        : $t('scenario.monthlyInterest');

      datasets.push({
        label: trancheLabel,
        data: trancheStacks[i],
        borderColor: trancheColors[i % trancheColors.length],
        backgroundColor: trancheColors[i % trancheColors.length] + '44',
        fill: '+1', // Fill to the next dataset in the array
        pointRadius: 0,
        borderWidth: 1.5,
        tension: 0.1,
        order: 10
      });
    }

    // Amortization
    datasets.push({
      label: $t('scenario.monthlyAmortization'),
      data: stack_Amort,
      borderColor: isDark ? '#5eead4' : '#2dd4bf',
      backgroundColor: isDark ? 'rgba(94, 234, 212, 0.2)' : 'rgba(45, 212, 191, 0.2)',
      fill: '+1', // Fill to Fixed
      pointRadius: 0,
      borderWidth: 1,
      tension: 0.1,
      order: 10
    });

    // Fixed Costs
    datasets.push({
      label: $t('comparison.table.operating') + ' & ' + $t('comparison.table.fee'),
      data: stack_Fixed,
      borderColor: isDark ? '#a8a29e' : '#78716c',
      backgroundColor: isDark ? 'rgba(168, 162, 158, 0.3)' : 'rgba(120, 113, 108, 0.2)',
      fill: 'origin',
      pointRadius: 0,
      borderWidth: 1,
      tension: 0.1,
      order: 10
    });

    return { labels, datasets };
  }

  import type { ChartOptions, TooltipItem } from 'chart.js';

  function getChartOptions(): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: isDark ? '#78716c' : '#a8a29e',
            autoSkip: true,
            maxTicksLimit: 6,
            maxRotation: 0,
            font: { size: 9 }
          }
        },
        y: {
          grid: { color: isDark ? 'rgba(68, 64, 60, 0.3)' : 'rgba(231, 229, 228, 0.5)' },
          ticks: {
            color: isDark ? '#78716c' : '#a8a29e',
            callback: function (value: string | number) {
              const num = typeof value === 'string' ? parseFloat(value) : value;
              return num >= 1000 ? num / 1000 + 'k' : num;
            },
            maxTicksLimit: 5,
            font: { size: 9 }
          },
          beginAtZero: true,
          stacked: false // We use manual stacking for absolute comparison line clarity
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: isDark ? '#a8a29e' : '#78716c',
            usePointStyle: true,
            pointStyle: 'rect',
            boxWidth: 6,
            padding: 15,
            font: { size: 9 },
            // Only show labels for the components and not the absolute total lines if too many
            filter: function (item: { text: string }) {
              return !item.text.includes($t('scenario.totalMonthly'));
            }
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#292524' : '#ffffff',
          titleColor: isDark ? '#fafaf9' : '#1c1917',
          bodyColor: isDark ? '#d6d3d1' : '#44403c',
          borderColor: isDark ? '#44403c' : '#e7e5e4',
          borderWidth: 1,
          padding: 8,
          bodyFont: { size: 11 },
          titleFont: { size: 11 },
          itemSort: function (a: TooltipItem<'line'>, b: TooltipItem<'line'>) {
            return ((b.raw as number) || 0) - ((a.raw as number) || 0);
          },
          callbacks: {
            label: function (context: TooltipItem<'line'>) {
              let label = context.dataset.label || '';
              let value = (context.parsed.y as number) || 0;

              // Handle manual stack display in tooltip
              // Since stacked datasets use fill: '+1', we can subtract the next dataset's value
              if (context.dataset.fill === '+1') {
                const datasets = context.chart.data.datasets;
                const nextDataset = datasets[context.datasetIndex + 1];

                if (nextDataset && nextDataset.data[context.dataIndex] !== undefined) {
                  const prevValue = nextDataset.data[context.dataIndex] as number;
                  value = value - prevValue;
                }
              }

              if (label) {
                label += ': ';
              }
              label += new Intl.NumberFormat('sv-SE', {
                style: 'currency',
                currency: 'SEK',
                maximumFractionDigits: 0
              }).format(value);
              return label;
            }
          }
        }
      }
    };
  }

  $effect(() => {
    // React to any of these changing - accessing variables to trigger reactivity
    void [
      loanAmount,
      interestRate,
      additionalInterestRates,
      loanTranches,
      monthlyAmortization,
      monthlyOperating,
      monthlyFee,
      monthlyPropertyTax,
      isDark
    ];

    if (canvas) {
      if (chart) {
        chart.data = getChartData();
        chart.options = getChartOptions();
        chart.update('none');
      } else {
        chart = new Chart(canvas, {
          type: 'line',
          data: getChartData(),
          options: getChartOptions()
        });
      }
    }
  });

  onMount(() => {
    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  });
</script>

<div class="mt-4 h-48 w-full opacity-90 md:h-64">
  <canvas bind:this={canvas}></canvas>
</div>
