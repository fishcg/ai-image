// 仪表盘图表逻辑
let charts = {};

async function loadStats() {
  try {
    const response = await fetch('/api/admin/stats');
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/pages/admin/login.html';
        return;
      }
      throw new Error('Failed to load stats');
    }

    const data = await response.json();
    document.getElementById('totalUsers').textContent = data.totalUsers;
    document.getElementById('activeUsers').textContent = data.activeUsers;
    document.getElementById('disabledUsers').textContent = data.disabledUsers;
    document.getElementById('totalGenerations').textContent = data.totalGenerations;
    document.getElementById('thisMonthGenerations').textContent = data.thisMonthGenerations;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

async function loadChartData() {
  try {
    const response = await fetch('/api/admin/chart-data');
    if (!response.ok) {
      throw new Error('Failed to load chart data');
    }

    const data = await response.json();

    // 渲染所有图表
    renderMonthlyUsageChart(data.monthlyUsage);
    renderDailyGenerationsChart(data.dailyGenerations);
    renderUserGrowthChart(data.userGrowth);
    renderModelDistributionChart(data.modelDistribution);
    renderModeDistributionChart(data.modeDistribution);
    renderTopUsersChart(data.topUsers);
  } catch (error) {
    console.error('Failed to load chart data:', error);
  }
}

// 月度使用量趋势图
function renderMonthlyUsageChart(data) {
  const ctx = document.getElementById('monthlyUsageChart');
  if (!ctx) return;

  if (charts.monthlyUsage) charts.monthlyUsage.destroy();

  charts.monthlyUsage = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(item => item.month),
      datasets: [{
        label: '生成次数',
        data: data.map(item => item.count),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    }
  });
}

// 每日生成量图表
function renderDailyGenerationsChart(data) {
  const ctx = document.getElementById('dailyGenerationsChart');
  if (!ctx) return;

  if (charts.dailyGenerations) charts.dailyGenerations.destroy();

  charts.dailyGenerations = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(item => item.date.slice(5)), // 只显示月-日
      datasets: [{
        label: '生成次数',
        data: data.map(item => item.count),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10b981',
        borderWidth: 1,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// 用户增长趋势图
function renderUserGrowthChart(data) {
  const ctx = document.getElementById('userGrowthChart');
  if (!ctx) return;

  if (charts.userGrowth) charts.userGrowth.destroy();

  // 计算累计用户数
  let cumulative = 0;
  const cumulativeData = data.map(item => {
    cumulative += item.count;
    return cumulative;
  });

  charts.userGrowth = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(item => item.month),
      datasets: [{
        label: '新增用户',
        data: data.map(item => item.count),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        yAxisID: 'y',
      }, {
        label: '累计用户',
        data: cumulativeData,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          labels: {
            color: 'rgba(255, 255, 255, 0.9)'
          }
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            drawOnChartArea: false,
          }
        },
        x: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    }
  });
}

// 模型使用分布图
function renderModelDistributionChart(data) {
  const ctx = document.getElementById('modelDistributionChart');
  if (!ctx) return;

  if (charts.modelDistribution) charts.modelDistribution.destroy();

  const modelNames = {
    'dashscope': '快速修图',
    'google-nano-banana-pro': 'Google Nano',
    'jimeng': '即梦4.0',
    'gpt-image': 'GPT Image'
  };

  charts.modelDistribution = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(item => modelNames[item.model_id] || item.model_id),
      datasets: [{
        data: data.map(item => item.count),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          '#6366f1',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
        ],
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: 'rgba(255, 255, 255, 0.9)',
            padding: 15
          }
        }
      }
    }
  });
}

// 生成模式分布图
function renderModeDistributionChart(data) {
  const ctx = document.getElementById('modeDistributionChart');
  if (!ctx) return;

  if (charts.modeDistribution) charts.modeDistribution.destroy();

  const modeNames = {
    'img2img': '修图模式',
    'txt2img': '生图模式'
  };

  charts.modeDistribution = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.map(item => modeNames[item.mode] || item.mode),
      datasets: [{
        data: data.map(item => item.count),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderColor: [
          '#6366f1',
          '#10b981',
        ],
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: 'rgba(255, 255, 255, 0.9)',
            padding: 15
          }
        }
      }
    }
  });
}

// TOP 10 活跃用户图表
function renderTopUsersChart(data) {
  const ctx = document.getElementById('topUsersChart');
  if (!ctx) return;

  if (charts.topUsers) charts.topUsers.destroy();

  charts.topUsers = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(item => item.username),
      datasets: [{
        label: '生成次数',
        data: data.map(item => item.generation_count),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: '#8b5cf6',
        borderWidth: 1,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.5,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// 初始化
AdminAuth.init();
loadStats();
loadChartData();
