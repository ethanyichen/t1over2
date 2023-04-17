
let data, map, timePeriod, barChart, scatterPlot

let historicalTimePeriods, periodNameArr;

let mapDispatch = d3.dispatch('mapDispatch')

let barChartDispatch = d3.dispatch('barChartDispatch')

let timePeriodDispatch =  d3.dispatch('timePeriodDispatch')

let scatterplotHoverDispatch = d3.dispatch('scatterplotHoverDispatch')

let mapHoverDispatch = d3.dispatch('mapHoverDispatch')

let occupationDispatch = d3.dispatch('occupationHoverDispatch')

let selectedCountry = ''
let activeOccupation = ''
let activePeriods = []

// controls number of marks on scatter-plot and zoomed-in map, showing top few sorted by page views
const infoDensityIndex = 20

// Load data and initialize the graphs
d3.csv('data/person_2020_update.csv').then((_data) => {
  data = _data
  // Remove person with NaN value of non_en_page_views, bplace country, and birthyear
  data = data.filter((d) => d.non_en_page_views !== "" && d.bplace_country !== "" && d.birthyear !== "");

  // Change numeric value from string
  data.forEach((d) => {
    d.id = +d.id
    d.birthyear = +d.birthyear
    d.deathyear = +d.deathyear
    d.hpi = +d.hpi
    d.non_en_page_views = +d.non_en_page_views;
    d.bplace_lat = +d.bplace_lat
    d.bplace_lon = +d.bplace_lon
    d.occupation = toTitleCase(d.occupation)
    d.alive = toTitleCase(d.alive)
  })

  let occupations = d3.group(data, (d) => d.occupation);

  let filterFunction = (d) => (d.non_en_page_views > 100000 || d.hpi > 65)

  data = data.filter(filterFunction)

  map = new MapGraph(data, { parentElement: '#map-graph' , infoDensityIndex: infoDensityIndex},mapDispatch, mapHoverDispatch)

  barChart = new BarChart(
    data,
    { parentElement: '#bar-chart' },
    barChartDispatch,
    data,
      selectedCountry,
      occupationDispatch
  )
  scatterPlot = new ScatterPlot(data,
    { parentElement: '#scatter-plot' , infoDensityIndex: infoDensityIndex},selectedCountry,activeOccupation,scatterplotHoverDispatch);


  // initialize timePeriod and set display values based on initial selection
  d3.json('data/historical_time_periods.json').then((data) => {
        historicalTimePeriods = data;
        periodNameArr = historicalTimePeriods.map(o => o["Name"]);
        timePeriod = new TimePeriod(historicalTimePeriods, {parentElement: '#time-periods'},timePeriodDispatch);
        timePeriod.updateVis();
        timePeriod.setInitialActivePeriodsAndUpdateViews();
      }
  )
});


// Dispatchers

// Dispatcher handler for hovering the bar in bargraph (bar -> Scatterplot && Map);
occupationDispatch.on('occupationHoverDispatch', (event) => {
  if(event === undefined){
    event = ''
  }
  scatterPlot.highlightedOccupation = event
  scatterPlot.handleDispatch()
  map.highlightedOccupation = event
  map.dispatchHandle()
});

// Dispatcher handler for hovering the point in Scatterplot (Scatterplot -> bar && map) 
scatterplotHoverDispatch.on('scatterplotHoverDispatch', (event) => {
  if(event.country === undefined){
    event.country = "";
  }
  if(event.id === undefined){
    event.id = '';
  }
  if(event.occupation === undefined){
    event.occupation = '';
  }
  barChart.highlightedOccupation = event.occupation;
  updateBarChart();
  map.highlightCountry = event.country;
  map.highlightID = event.id;
  map.dispatchHandle();
});

mapDispatch.on('mapDispatch', (eventData) => {
  selectedCountry = eventData

  //remove occupation selection for BarChart and ScatterPlot when country reselected
  activeOccupation = ''
  barChart.resetOccupationSelection();

  updateBarChart()
  updateScatterPlot()
  updateMap()
});

mapHoverDispatch.on('mapHoverDispatch', (event) => {
  if(event.id === undefined){
    event.id = '';
  }
  if(event.occupation === undefined){
    event.occupation = '';
  }
  barChart.highlightedOccupation = event.occupation;
  updateBarChart();
  scatterPlot.highlightedID = event.id;
  scatterPlot.handleDispatch();
})

barChartDispatch.on('barChartDispatch', (event) => {
  activeOccupation = event.activeOccupation;
  scatterPlot.activeOccupation = activeOccupation;
  map.activeOccupation = activeOccupation;

  updateScatterPlot()
  updateMap()
});

timePeriodDispatch.on('timePeriodDispatch', (event) => {
  activePeriods = event

  //reset occupation selection for all views
  activeOccupation = ''
  barChart.resetOccupationSelection()
  map.resetOccupationSelection();
  scatterPlot.resetOccupationSelection();

  scatterPlot.setTimePeriods(activePeriods);

  updateBarChart()
  updateScatterPlot()
  updateMap()
});

function updateBarChart () {
  barChart.selectedCountry = selectedCountry
  if (selectedCountry === '') {
    barChart.data = data
  }else {
    barChart.data = data.filter(d=>d.bplace_country === selectedCountry)
  }
  barChart.data = barChart.data.filter(d=> isWithinSelectedPeriods(d))
  barChart.updateVis()
}

function updateScatterPlot () {
  scatterPlot.selectedCountry = selectedCountry
  scatterPlot.activeOccupation = activeOccupation

  const noSelectedCountry = selectedCountry === ''
  const noActiveOccupation = activeOccupation === ''

  if ( noSelectedCountry&& noActiveOccupation ) {
    scatterPlot.data = data
  } else if (noActiveOccupation){
    scatterPlot.data = data.filter(d=>d.bplace_country === selectedCountry)
  } else if (noSelectedCountry) {
    scatterPlot.data = data.filter(d=>d.occupation === activeOccupation)
  } else {
    scatterPlot.data = data.filter(d=>d.occupation === activeOccupation && d.bplace_country === selectedCountry)
  }

  scatterPlot.data = scatterPlot.data.filter(d=> isWithinSelectedPeriods(d))
  scatterPlot.updateVis()
}

function updateMap() {
  const noActiveOccupation =activeOccupation === ''
  map.data = data.filter(isWithinSelectedPeriods)
  if (!noActiveOccupation) {
    map.data = map.data.filter(d=>d.occupation === activeOccupation)
  }
  map.updateVis()
}


function isInYearRange (y,yearRange){
  return y <= yearRange[1] && y >= yearRange[0]
}

function isWithinSelectedPeriods(d) {
  const birthyear = d.birthyear
  let display = false

  if (activePeriods.length === 0) return false;

  for(let i = 0; i < periodNameArr.length; i++) {
    if(activePeriods.includes(periodNameArr[i])) {
      display = display || isInYearRange(birthyear, historicalTimePeriods.find(o => o["Name"] == periodNameArr[i]).yearRange);
    }
  }
  return display
}

function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, function (match) {
    return match.toUpperCase();
  });
}
