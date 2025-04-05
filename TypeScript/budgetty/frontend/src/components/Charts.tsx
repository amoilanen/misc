import React, { useMemo } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { Box, FormControl, InputLabel, Select, MenuItem, Grid, Card, CardContent, CardHeader, Divider, Typography } from '@mui/material';
import { Event, Category } from '../types';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface ChartsProps {
  events: Event[];
  categories: Category[];
}

interface ChartData {
  id: string;
  data: Array<{
    x: string;
    y: number;
  }>;
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
    
    const incomeData: ChartData = {
      id: 'Income',
      data: days.map(day => ({
        x: format(day, 'MMM dd'),
        y: filteredEvents
          .filter(event => new Date(event.date) <= day && event.amount > 0)
          .reduce((sum, event) => sum + event.amount, 0)
      }))
    };

    const expensesData: ChartData = {
      id: 'Expenses',
      data: days.map(day => ({
        x: format(day, 'MMM dd'),
        y: Math.abs(filteredEvents
          .filter(event => new Date(event.date) <= day && event.amount < 0)
          .reduce((sum, event) => sum + event.amount, 0))
      }))
    };

    return [incomeData, expensesData];
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

    return Object.entries(categoryTotals).map(([id, value]) => ({
      id,
      value
    }));
  }, [filteredEvents, categories]);

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
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ height: '100%', minHeight: 600 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Income vs Expenses Over Time
                  </Typography>
                  <Box sx={{ height: 550 }}>
                    <ResponsiveLine
                      data={lineChartData}
                      margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
                      xScale={{ type: 'point' }}
                      yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: -45,
                        legend: 'Date',
                        legendOffset: 45,
                        legendPosition: 'middle'
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Amount (€)',
                        legendOffset: -60,
                        legendPosition: 'middle'
                      }}
                      pointSize={10}
                      pointColor={{ theme: 'background' }}
                      pointBorderWidth={2}
                      pointBorderColor={{ from: 'serieColor' }}
                      pointLabelYOffset={-12}
                      useMesh={true}
                      legends={[
                        {
                          anchor: 'bottom-right',
                          direction: 'column',
                          justify: false,
                          translateX: 100,
                          translateY: 0,
                          itemsSpacing: 0,
                          itemDirection: 'left-to-right',
                          itemWidth: 80,
                          itemHeight: 20,
                          itemOpacity: 0.75,
                          symbolSize: 12,
                          symbolShape: 'circle',
                          symbolBorderColor: 'rgba(0, 0, 0, .5)',
                          effects: [
                            {
                              on: 'hover',
                              style: {
                                itemBackground: 'rgba(0, 0, 0, .03)',
                                itemOpacity: 1
                              }
                            }
                          ]
                        }
                      ]}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Card variant="outlined" sx={{ height: '100%', minHeight: 600 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Expenses by Category
                  </Typography>
                  <Box sx={{ height: 550 }}>
                    <ResponsivePie
                      data={pieChartData}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      innerRadius={0.5}
                      padAngle={0.7}
                      cornerRadius={3}
                      activeOuterRadiusOffset={8}
                      borderWidth={1}
                      borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                      arcLinkLabelsSkipAngle={10}
                      arcLinkLabelsTextColor="#333333"
                      arcLinkLabelsThickness={2}
                      arcLinkLabelsColor={{ from: 'color' }}
                      arcLabelsSkipAngle={10}
                      arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                      legends={[
                        {
                          anchor: 'bottom',
                          direction: 'row',
                          justify: false,
                          translateX: 0,
                          translateY: 56,
                          itemsSpacing: 0,
                          itemWidth: 100,
                          itemHeight: 18,
                          itemTextColor: '#999',
                          itemDirection: 'left-to-right',
                          itemOpacity: 1,
                          symbolSize: 18,
                          symbolShape: 'circle',
                          effects: [
                            {
                              on: 'hover',
                              style: {
                                itemTextColor: '#000'
                              }
                            }
                          ]
                        }
                      ]}
                    />
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