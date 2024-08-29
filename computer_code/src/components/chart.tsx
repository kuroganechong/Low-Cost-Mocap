import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { MutableRefObject, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const options: ChartOptions<"line"> = {
  animation: false,
  responsive: true,
  spanGaps: true,
  showLine: true,
  plugins: {
    tooltip: {
      enabled: false,
    },
    legend: {
      align: 'start',
    },
    title: {
      display: true,
      text: 'Object Position',
    },
  },
  scales: {
    A: {
      type: 'linear',
      position: 'left',
    }, 
    B: {
      type: 'linear',
      position: 'left',
      max: Math.PI/2,
      min: -Math.PI/2,
    }
    // C: {
    //   type: 'linear',
    //   position: 'left'
    // }
  },
  elements: {
    point: {
        radius: 0 // default to disabled in all datasets
    }
  }
};

let dataTemplate: ChartData<"line", number[], number> = {
  labels: [] as number[],
  datasets: [
    {
      label: 'X',
      data: [] as number[],
      borderColor: 'rgb(255, 0, 0)',
      backgroundColor: 'rgba(255, 0, 0, 0.5)',
      yAxisID: "A",
    },
    {
      label: 'Y',
      data: [] as number[],
      borderColor: 'rgb(0, 255, 0)',
      backgroundColor: 'rgba(0, 255, 0, 0.5)',
      yAxisID: "A"
    },
    {
      label: 'Z',
      data: [] as number[],
      borderColor: 'rgb(0, 0, 255)',
      backgroundColor: 'rgba(0, 0, 255, 0.5)',
      yAxisID: "A",
    }
  ,
    {
      label: 'YAW',
      data: [] as number[],
      borderColor: 'rgb(128, 128, 128)',
      backgroundColor: 'rgba(128, 128, 128, 0.5)',
      yAxisID: "B"
    },
    {
      label: 'X Vel',
      data: [] as number[],
      borderColor: 'rgb(220, 220, 0)',
      backgroundColor: 'rgba(220, 220, 0, 0.5)',
      yAxisID: "A"
    },
    {
      label: 'Y Vel',
      data: [] as number[],
      borderColor: 'rgb(0, 220, 220)',
      backgroundColor: 'rgba(0, 220, 220, 0.5)',
      yAxisID: "A"
    },
    {
      label: 'Z Vel',
      data: [] as number[],
      borderColor: 'rgb(220, 0, 220)',
      backgroundColor: 'rgba(220, 0, 220, 0.5)',
      yAxisID: "A"
    }
  ],
};

let data = structuredClone(dataTemplate)

export default function Chart({filteredObjectsRef, objectPointCount}: 
  {filteredObjectsRef: MutableRefObject<object>, objectPointCount: number}) {
  let chartRef = useRef<ChartJS<"line", number[], number> | null>(null);

  useEffect(() => {
    // console.log(filteredObjectsRef.current)
    let sliced = (filteredObjectsRef.current as any[]).length <= 15 ? [] : (filteredObjectsRef.current as any[]).slice(15)
    const length = sliced.length
    if (length === 0) {
      data = structuredClone(dataTemplate)
    }
    else if (length !== data.labels![data.labels!.length - 1]) {
      const lastFilteredPoint = sliced[length-1].filter((x: { index: number; }) => x.index === 0)[0]
  
      if (lastFilteredPoint !== undefined) {
        if (data.labels) {
          data.labels.push(length);
        }

        // console.log(lastFilteredPoint)
        data.datasets[0].data.push(lastFilteredPoint["pos"][0])
        data.datasets[1].data.push(lastFilteredPoint["pos"][1])
        data.datasets[2].data.push(lastFilteredPoint["pos"][2])
    
        data.datasets[3].data.push(lastFilteredPoint["heading"])
        
        if (lastFilteredPoint["vel"]) {
          data.datasets[4].data.push(lastFilteredPoint["vel"][0])
          data.datasets[5].data.push(lastFilteredPoint["vel"][1])
          data.datasets[6].data.push(lastFilteredPoint["vel"][2])
        }
        else {
          data.datasets[4].data.push(0)
          data.datasets[5].data.push(0)
          data.datasets[6].data.push(0)
        }
        
        // If data length > 100, remove the first element
        if(data.labels && data.labels.length > 100) {
          data.labels.shift()
          data.datasets[0].data.shift()
          data.datasets[1].data.shift()
          data.datasets[2].data.shift()
          data.datasets[3].data.shift()
          data.datasets[4].data.shift()
          data.datasets[5].data.shift()
          data.datasets[6].data.shift()
        }
      }
    }

    chartRef.current?.update()
  }, [objectPointCount])

  return <Line ref={chartRef} options={options} data={data} height={"115px"}/>;
}
