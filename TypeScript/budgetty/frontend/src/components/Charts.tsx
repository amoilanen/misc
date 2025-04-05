import React, { useMemo } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Box, FormControl, InputLabel, Select, MenuItem, Card, CardContent, CardHeader, Divider, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Event, Category } from '../types';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Define interface for transaction details
interface TransactionDetail {
  amount: number;
  description: string;
}

interface ChartsProps {
  events: Event[];
  categories: Category[];
}

export const Charts: React.FC<ChartsProps> = ({ events, categories }) => {
  const [timeRange, setTimeRange] = React.useState<'month' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const startDate = timeRange === 'month' 
      ? startOfMonth(subMonths(now, 1))
      : startOfMonth(subMonths(now, 12));
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const matchesDate = eventDate >= startDate && eventDate <= now;
      const matchesCategory = selectedCategory === 'all' || event.categoryId === selectedCategory;
      return matchesDate && matchesCategory;
    });
  }, [events, timeRange, selectedCategory]);

  const lineChartData = useMemo(() => {
    const now = new Date();
    const startDate = timeRange === 'month' 
      ? startOfMonth(subMonths(now, 1))
      : startOfMonth(subMonths(now, 12));
    
    const days = eachDayOfInterval({ start: startDate, end: now });
    
    // Filter days to only include those with events
    const daysWithEvents = days.filter(day => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      
      return filteredEvents.some(event => {
        const eventDate = new Date(event.date);
        return eventDate >= dayStart && eventDate <= dayEnd;
      });
    });
    
    const labels = daysWithEvents.map(day => format(day, 'MMM dd'));
    
    // Create arrays to store both amounts and descriptions
    const incomeData = daysWithEvents.map(day => 
      filteredEvents
        .filter(event => new Date(event.date) <= day && event.amount > 0)
        .reduce((sum, event) => sum + event.amount, 0)
    );

    const expensesData = daysWithEvents.map(day => 
      Math.abs(filteredEvents
        .filter(event => new Date(event.date) <= day && event.amount < 0)
        .reduce((sum, event) => sum + event.amount, 0))
    );

    // Store event details for tooltips - only the events that occurred on each specific day
    const incomeDetails = daysWithEvents.map(day => {
      // Get events that occurred on this specific day
      const dayEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.date);
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        return eventDate >= dayStart && eventDate <= dayEnd && event.amount > 0;
      });
      
      return dayEvents.map(event => ({
        amount: event.amount,
        description: event.description
      }));
    });

    const expensesDetails = daysWithEvents.map(day => {
      // Get events that occurred on this specific day
      const dayEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.date);
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        return eventDate >= dayStart && eventDate <= dayEnd && event.amount < 0;
      });
      
      return dayEvents.map(event => ({
        amount: Math.abs(event.amount),
        description: event.description
      }));
    });

    return {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
          details: incomeDetails
        },
        {
          label: 'Expenses',
          data: expensesData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.1,
          details: expensesDetails
        }
      ]
    };
  }, [filteredEvents, timeRange]);

  const pieChartData = useMemo(() => {
    const categoryTotals = filteredEvents.reduce((acc, event) => {
      if (event.amount < 0) { // Only consider expenses for pie chart
        const category = categories.find(c => c.id === event.categoryId);
        const categoryName = category?.name || 'Uncategorized';
        acc[categoryName] = (acc[categoryName] || 0) + Math.abs(event.amount);
      }
      return acc;
    }, {} as Record<string, number>);

    const colors = [
      'rgba(255, 99, 132, 0.5)',
      'rgba(54, 162, 235, 0.5)',
      'rgba(255, 206, 86, 0.5)',
      'rgba(75, 192, 192, 0.5)',
      'rgba(153, 102, 255, 0.5)',
      'rgba(255, 159, 64, 0.5)',
    ];

    return {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.5', '1')),
        borderWidth: 1
      }]
    };
  }, [filteredEvents, categories]);

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Income vs Expenses Over Time'
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const runningTotal = context.parsed.y;
            const details = context.dataset.details[context.dataIndex];
            
            // Format the running total with currency symbol
            const formattedRunningTotal = `${runningTotal.toFixed(2)}€`;
            
            // If there are transaction details for this specific day, include all of them
            if (details && details.length > 0) {
              // Create an array with the running total as the first line
              const tooltipLines = [`${label}: ${formattedRunningTotal}`];
              
              // Add each event as a separate line
              details.forEach((event: TransactionDetail) => {
                tooltipLines.push(`${event.amount.toFixed(2)}€ - ${event.description}`);
              });
              
              return tooltipLines;
            }
            
            return `${label}: ${formattedRunningTotal}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (€)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Expenses by Category'
      }
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Card elevation={0} sx={{ bgcolor: 'background.default' }}>
        <CardHeader 
          title="Financial Analytics" 
          subheader="Analyze your income and expenses over time"
          action={
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value as 'month' | 'year')}
                >
                  <MenuItem value="month">Last Month</MenuItem>
                  <MenuItem value="year">Last Year</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          }
        />
        <Divider />
        <CardContent sx={{ p: 4 }}>
          <Grid 
            container 
            sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              flexWrap: 'wrap' 
            }}
          >
            <Grid 
              item
              padding={1}
              xs={12} 
              md={6} 
              sx={{ 
                flexGrow: { md: 0 },
                flexBasis: { md: '50%' },
                maxWidth: { md: '50%' } 
              }}
            >
              <Card variant="outlined" sx={{ height: '100%', minHeight: 600 }}>
                <CardContent>
                  <Box sx={{ height: 550 }}>
                    <Line data={lineChartData} options={lineChartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid 
              item
              padding={1}
              xs={12} 
              md={6} 
              sx={{ 
                flexGrow: { md: 0 },
                flexBasis: { md: '50%' },
                maxWidth: { md: '50%' } 
              }}
            >
              <Card variant="outlined" sx={{ height: '100%', minHeight: 600 }}>
                <CardContent>
                  <Box sx={{ height: 550 }}>
                    <Pie data={pieChartData} options={pieChartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}; 