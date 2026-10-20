
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionItem } from "@/types/action";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useIsMobile } from "@/hooks/use-mobile";

interface ActionChartsProps {
  actions: ActionItem[];
  isLoading: boolean;
}

export function ActionCharts({ actions, isLoading }: ActionChartsProps) {
  const isMobile = useIsMobile();
  
  // Data for completed vs pending tasks pie chart
  const completionData = [
    {
      name: "Completed",
      value: actions.filter(action => action.completed).length,
    },
    {
      name: "Pending",
      value: actions.filter(action => !action.completed).length,
    }
  ];
  
  // Colors for pie chart
  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--muted-foreground))"];
  
  // Data for department distribution bar chart
  const departmentMap: Record<string, number> = {};
  actions.forEach(action => {
    if (departmentMap[action.department]) {
      departmentMap[action.department]++;
    } else {
      departmentMap[action.department] = 1;
    }
  });
  
  const departmentData = Object.entries(departmentMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, isMobile ? 5 : 10); // Show fewer departments on mobile
    
  const chartConfig = {
    completed: { label: "Completed", color: "hsl(var(--chart-1))" },
    pending: { label: "Pending", color: "hsl(var(--muted-foreground))" },
    department: { label: "Tasks by Department", color: "hsl(var(--chart-1))" }
  };

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Action Items</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-lg font-medium">Task Completion Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className={`${isMobile ? 'h-[200px]' : 'h-[300px]'} w-full`}>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={isMobile ? { top: 0, right: 0, bottom: 0, left: 0 } : { top: 5, right: 30, left: 20, bottom: 5 }}>
                  <Pie
                    data={completionData}
                    cx="50%"
                    cy="50%"
                    labelLine={!isMobile}
                    outerRadius={isMobile ? 60 : 100}
                    fill="hsl(var(--chart-4))"
                    dataKey="value"
                    label={!isMobile ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : undefined}
                  >
                    {completionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={({ active, payload }) => (
                      active && payload && payload.length ? (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1">
                              <div 
                                className="h-3 w-3 rounded-full" 
                                style={{ 
                                  backgroundColor: payload[0].payload.fill || COLORS[payload[0].name === "Completed" ? 0 : 1]
                                }} 
                              />
                              <p className="text-sm font-medium">
                                {payload[0].name}
                              </p>
                            </div>
                            <p className="text-sm font-medium">
                              {payload[0].value}
                            </p>
                          </div>
                        </div>
                      ) : null
                    )}
                  />
                  {isMobile && <Legend />}
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-lg font-medium">Task Distribution by Department</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className={`${isMobile ? 'h-[200px]' : 'h-[300px]'} w-full`}>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentData}
                  layout={isMobile ? "horizontal" : "vertical"}
                  margin={isMobile ? 
                    { top: 5, right: 10, left: 10, bottom: 30 } : 
                    { top: 5, right: 30, left: 20, bottom: 5 }
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={!isMobile} vertical={isMobile} />
                  {isMobile ? (
                    <>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis type="number" />
                    </>
                  ) : (
                    <>
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={150}
                        tick={{ fontSize: 12 }}
                      />
                    </>
                  )}
                  <ChartTooltip
                    content={({ active, payload, label }) => (
                      active && payload && payload.length ? (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <p className="text-sm font-medium">
                            {isMobile ? label : payload[0].payload.name}: {payload[0].value}
                          </p>
                        </div>
                      ) : null
                    )}
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
