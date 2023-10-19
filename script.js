function finalproject(){
    let filePath1="spotify_artist_data.csv";

    loading0(filePath1); //preprocess data 
 
}

let loading0=function(filePath){
    
    d3.csv(filePath).then(function(data){
    //preprocess data here 
    d3.rollup(data, 
        d => d[""] = parseInt(d[""]),
        d => d["Artist Name"] = String(d["Artist Name"]),  
        d => d["Lead Streams"] = parseInt(d["Lead Streams"].replace(/,/g, '')),
        d => d.Feats = parseInt(d.Feats),
        d => d.Tracks = parseInt(d.Tracks),
        d => d["One Billion"] =  parseInt(d["One Billion"]),
        d => d["100 Million"] = parseInt(d["100 Million"]),
        d => d["Last Updated"] = Date(d["Last Updated"])
    );  
    plot1(data);
    });
    Promise.all([
        d3.csv("edges.csv"),
        d3.csv("nodes.csv")
      ]).then(([data1, data2]) => {
        data2 = data2.filter(function(d) {
                    return d.popularity > 85;
                  });
                data1 = data1.filter(function(d) {
                    return data2.map(item => item.spotify_id).includes(d.id_0) && 
                           data2.map(item => item.spotify_id).includes(d.id_1);
                  });
        // lookup nodes by Spotify ID by creating a map
        const nodeMap = new Map(data2.map(d => [d.spotify_id, d]));
        // data2 based on nodes present in data1
        const filteredData2 = data2.filter(d => {
          return nodeMap.has(d.spotify_id) && (
            data1.some(link => link.id_0 === d.spotify_id) ||
            data1.some(link => link.id_1 === d.spotify_id)
          );
        });
      
        // links array by for source and target nodes
        const links = data1.map(d => ({
          source: nodeMap.get(d.id_0),
          target: nodeMap.get(d.id_1)
        }));
        plot2(filteredData2, links);
      }).catch(err => {
        // handle any errors that occurred during data loading
        console.error(err);
      });
      // the data
    d3.csv("new_charts.csv").then(data => {
        // group the data by region
        d3.rollup(data, 
            d => d.rank = parseInt(d.rank), 
            d => d.artist = String(d.artist),
            d => d.region = String(d.region),
            d => d.streams =  +d.streams,
        );  
            const regionData = d3.group(data, d => d.region);
            
            // total streams per region
            const regionStreamsTotal = new Map();
            regionData.forEach((region, key) => {
            const totalStreams = d3.sum(region, d => +d.streams);
            regionStreamsTotal.set(key, totalStreams);
            });
            
            // top 5 artists per region
            const top5ArtistsByRegion = new Map();
            regionData.forEach((region, key) => {
            const artists = d3.group(region, d => d.artist);
            const topArtists = Array.from(artists, ([artist, songs]) => ({ artist, streams: d3.sum(songs, d => +d.streams) }))
                .sort((a, b) => b.streams - a.streams)
                .slice(0, 5)
                .map(d => d.artist);
            top5ArtistsByRegion.set(key, topArtists);
            });
        //plot it 
        plot3(regionStreamsTotal, top5ArtistsByRegion);
        });
}

let plot1=function(data){
   // create plot inside the div #q1_plot
    data = d3.filter(data, function(d) {return parseInt(d[""]) <= 50})
    const margin = { top: 75, bottom: 75, left: 120, right: 75 };
    const width = 900 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom; 
    var svg = d3.select("#q1_plot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top - 25})`);
    
    // X axis
    var xScale = d3.scaleBand()
        .domain(data.map(d => d["Artist Name"]))
        .range([0, width])
        .padding(0.2);
    const xAxis = d3.axisBottom().scale(xScale);

    svg
        .append("g")
        .style("font-size", "10px")
        .attr("transform", `translate(0, ${height})`)
        .attr("class", "axis")
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function (d) {
        return "rotate(-35)"});
    // Y axis
    var yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d["Lead Streams"])])
        .range([height, 0]);
    var yAxis = d3.axisLeft(yScale);
    var yAxisLabels = svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);
    yAxisLabels.selectAll("text")
        .style("font-size", "13px")
        .style("text-shadow", "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 0 #000")
        .style("font-family", "Gilroy");

    // add bars
    svg.selectAll(".bars")
      .data(data)
      .enter()
      .append('rect')
      .attr("class", "bars")
      .attr("fill", "#1DB954")
      .attr("stroke", "black")
      .attr("stroke-width", "2")
      .attr("x", d => xScale(d["Artist Name"]))
      .attr("y", d => yScale(d["Lead Streams"]))
      .attr("width", d => xScale.bandwidth())
      .attr("height", d => height - yScale(d["Lead Streams"]));

    // x - axis label 
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", (width/2))
        .attr("y", height + margin.bottom - 4)
        .style("text-shadow", "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000")
        .style("font-size", "20px")
        .text("Artists");
    // y - axis label
    svg.append("text")
        .attr("y", 0 - margin.left - 5)
        .attr("x", 0 - (height/2))
        .attr("transform", "rotate(-90)")
        .attr("dy", "1em")
        .style("text-shadow", "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000")
        .style("text-anchor", "middle")
        .style("font-size", "20px")
        .text("Lead Streams");
    // plot title 
    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0)
        .attr("text-anchor", "middle")  
        .style("font-size", "20px")  
        .style("text-shadow", "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000")
        .text("Top Lead Streams by Spotify Artists");
}

let plot2=function(filteredData2, links){
    const margin = { top: 75, bottom: 75, left: 125, right: 75 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom; 
    var svg = d3.select("#q2_plot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    svg.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "black")
        .attr("stroke", "white")
        .attr("stroke-width", "3")
        .attr("transform", `translate(${-margin.left}, ${-margin.top})`);
    // Calculate the number of links for each artist
  let artistLinks = {};
  links.forEach(link => {
    let source = link.source.spotify_id;
    let target = link.target.spotify_id;
    if (artistLinks[source]) {
      artistLinks[source]++;
    } else {
      artistLinks[source] = 1;
    }
    if (artistLinks[target]) {
      artistLinks[target]++;
    } else {
      artistLinks[target] = 1;
    }
  });

  // sorting artists based on the number of links
  let sortedArtists = Object.keys(artistLinks).sort((a, b) => artistLinks[b] - artistLinks[a]);

  // get top 50 artists with the most links
  let topArtists = sortedArtists.slice(0, 50);

  // data filter include only the top artists and their links
  let filteredLinks = links.filter(link => topArtists.includes(link.source.spotify_id) && topArtists.includes(link.target.spotify_id));

  // Use filteredData2 and filteredLinks to create the graph

  // Select the 'svg' element
  var svg = d3.select("#q2_plot").select("svg");

  // link elements
  let link = svg.selectAll("line")
    .data(filteredLinks)
    .enter()
    .append("line")
    .style("stroke", "#355E3B")
    .attr("stroke-width", 1);

  // node elements
  let node = svg.selectAll(".nodes")
    .data(filteredData2)
    .enter()
    .append("circle")
    .attr("class", "nodes")
    .attr("r", 10)
    .attr("fill", "#1DB954");

  // Create label elements
  let label = svg.selectAll(".label")
    .data(filteredData2)
    .enter()
    .append("text")
    .attr("class", "label")
    .text(d => `${d.name} (${artistLinks[d.spotify_id]})`) // number of links in the label text
    .attr("font-size", "10px")
    .style("fill", d => topArtists.includes(d.spotify_id) ? "white" : "lightgray");
//   
  const labelForce = d3.forceCollide(20).strength(0.8);
  const simulation = d3.forceSimulation(filteredData2)
    .force("center", d3.forceCenter(width/2, height/2))
    .force("link", d3.forceLink(filteredLinks).id(d => d.spotify_id))
    .force("charge", d3.forceManyBody())
    .force("collision", labelForce); // collision detection force


  simulation.on("tick", () => {
    // Update node positions
    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    // Update link positions
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    // Update label positions
    label
      .attr("x", d => d.x - 10)
      .attr("y", d => d.y + 3)
      .style("font-size", "10px");
  });

  let zoom = d3.zoom()
    .scaleExtent([1, 5])
    .translateExtent([[0, 0], [width, height]]) 
    .on("zoom", function(e) {
            svg.selectAll(".nodes")
              .attr("transform", e.transform);
            svg.selectAll("line")
              .attr("transform", e.transform);
            svg.selectAll(".label")
              .attr("transform", e.transform);
    });

  svg.call(zoom);
}
    
      


let plot3=function(regionStreams, topArtistsByRegion){
    // create plot inside the div #q3_plot
    const margin = { top: 75, bottom: 75, left: 125, right: 75 };
    const width = 850 - margin.left - margin.right;
    const height = 420 - margin.top - margin.bottom; 
    var svg = d3.select("#q3_plot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    svg.append("rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-width", "5")
        .attr("transform", `translate(${-margin.left}, ${-margin.top})`);
    const projection = d3.geoNaturalEarth1().scale(150).translate([width / 2.5, height / 2]);
    const pathGenerator = d3.geoPath().projection(projection);
    const streamDataArray = Array.from(regionStreams.values());
    let maxValue = d3.max(streamDataArray);
    let minValue = d3.min(streamDataArray);
    const colorScale = d3
        .scaleSymlog()
        .domain([minValue, maxValue])
        .range(["white", "#1DB954"]);
    d3.json('countries.geojson')
      .then(data => {
        const countries = data.features;
        svg.selectAll('path')
          .data(countries)
          .enter().append('path')
          .attr('class', 'country')
          .attr('d', pathGenerator)
          .attr("stroke", "black")
          .attr("stroke-width", "1.5px")
          .attr('fill', "white")
          .attr('fill', d => {
            const regionName = d.properties.SUBUNIT; 
            const streamData = regionStreams.get(regionName);
            if (streamData) {
                return colorScale(streamData);
              } else {
                return 'white'; //color to white for missing data
              }
        })
        .on("mouseover", onMouseOver)
        .on("mouseout", () => {tooltip.style("visibility", "hidden")})
    });
    var tooltip = d3.select("#q2_plot")
        .append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")

    var onMouseOver = function(event, d) {
        var countryName = d.properties.SUBUNIT;
        var topArtists = topArtistsByRegion.get(countryName);
        tooltip.style("visibility", "visible")
          .html("<strong>" + countryName + "</strong><br>")
          .style("left", `${event.pageX + 5}px`)
          .style("top", `${event.pageY}px`)
          .style("padding", ".1rem")
          .style("background", "#FFFFFF")
          .style("color", "#313639")
          .style("font-size", "0.75rem")
          .style("border", "2px solid #313639");
          
        if (topArtists) {
          topArtists.forEach((artist, index) => {
            tooltip.append("span")
              .style("display", "block")
              .html(`${index + 1}. ${artist}`);
          });
        } else {
          tooltip.append("span")
            .style("display", "block")
            .html("No data available");
        }
      };
// position and dimensions of the legend
const legendWidth = 20;
const legendHeight = height * 0.6;
const legendX = width + legendWidth ;
const legendY = (height - legendHeight - 150) / 3;

// legend SVG element
const legend = svg.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${legendX}, ${legendY})`);

// color scale gradient for the legend
const gradient = legend.append("defs")
  .append("linearGradient")
  .attr("id", "color-gradient")
  .attr("gradientTransform", "rotate(90)");

gradient.append("stop")
  .attr("offset", "0%")
  .attr("stop-color", "white");

gradient.append("stop")
  .attr("offset", "100%")
  .attr("stop-color", "#1DB954");

// Draw the gradient color bar in the legend
legend.append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", legendWidth)
  .attr("height", legendHeight)
  .style("fill", "url(#color-gradient)")
  .attr("stroke", "black")
  .attr("stroke-width", "2");

const legend_title = legend.append("text")
  .attr("color", "black")
  .attr("x", legendWidth - 60)
  .attr("y", -10)
  .style("fill", "black")
  .attr("font-size", "9")
  .style("font-family", "Gilroy")
  .text("Total Streams on Spotify");
// Add text labels for the minimum and maximum values
const minValueText = legend.append("text")
.attr("color", "black")
.attr("x", legendWidth - 30)
.attr("y", 3)
.style("fill", "black")
.attr("font-size", "10")
.text(0);

const maxValueText = legend.append("text")
.attr("color", "black")
.attr("x", legendWidth - 55)
.attr("y", legendHeight)
.style("fill", "black")
.attr("font-size", "8")
.text("27000000");

console.log(maxValue);
}

