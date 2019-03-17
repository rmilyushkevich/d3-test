(function () {
    function getData() {
        const url = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=MSFT&interval=5min&apikey=demo";
        return fetch(url);
    }

    getData().then((response) => response.json()).then((stockPrices) => {
        if (!stockPrices['Time Series (5min)']) {
            throw new Error('Invalid data');
        }

        const data = [];

        const prices = stockPrices['Time Series (5min)'];

        Object.keys(prices).forEach(date => {
            const price = prices[date];
            data.push([Date.parse(date), Number(price['5. volume'])]);
        });

        console.log(data.sort((a, b) => a[0] - b[0]));

        drawGraph(data.sort((a, b) => a[0] - b[0]));
    }).catch((e) => alert(e.message));

    function drawGraph(data) {
        const drawLineGraph = function(containerHeight, containerWidth, data, yLabel, warnLine) {
            const svg = d3.select("body").append("svg")
                .attr("width", containerWidth)
                .attr("height", containerHeight);

            const margin = { top: 100, left: 100, right: 50, bottom: 50 };

            const height = containerHeight - margin.top - margin.bottom;
            const width = containerWidth - margin.left - margin.right;

            const xDomain = d3.extent(data, function(d) { return d[0]; });
            const yDomain = d3.extent(data, function(d) { return d[1]; });

            const xScale = d3.time.scale().range([0, width]).domain(xDomain);
            const yScale = d3.scale.linear().range([height, 0]).domain(yDomain);

            const xAxis = d3.svg.axis().scale(xScale).orient('bottom');
            const yAxis = d3.svg.axis().scale(yScale).orient('left');

            const line = d3.svg.line()
                .x(function(d) { return xScale(d[0]); })
                .y(function(d) { return yScale(d[1]); });

            const area = d3.svg.area()
                .x(function(d) { return xScale(d[0]); })
                .y0(function(d) { return yScale(d[1]); })
                .y1(height);

            const g = svg.append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

            g.append('path')
                .datum(data)
                .attr('class', 'area')
                .attr('d', area);

            g.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0, ' + height + ')')
                .call(xAxis);

            g.append('g')
                .attr('class', 'y axis')
                .call(yAxis)
                .append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', 6)
                .attr('dy', '.71em')
                .attr('text-anchor', 'end')
                .text(yLabel);

            g.append('path')
                .datum(data)
                .attr('class', 'line')
                .attr('d', line);

            g.selectAll('circle').data(data).enter().append('circle')
                .attr('cx', function(d) { return xScale(d[0]); })
                .attr('cy', function(d) { return yScale(d[1]); })
                .attr('r', 5)
                .attr('class', 'circle');

            // focus tracking

            const focus = g.append('g').style('display', 'none');

            focus.append('line')
                .attr('id', 'focusLineX')
                .attr('class', 'focusLine');

            focus.append('line')
                .attr('id', 'focusLineY')
                .attr('class', 'focusLine');

            focus.append('circle')
                .attr('id', 'focusCircle')
                .attr('r', 5)
                .attr('class', 'circle focusCircle');

            const bisectDate = d3.bisector(function(d) { return d[0]; }).left;

            g.append('rect')
                .attr('class', 'overlay')
                .attr('width', width)
                .attr('height', height)
                .on('mouseover', function() { focus.style('display', null); })
                .on('mouseout', function() { focus.style('display', 'none'); })
                .on('mousemove', function() {
                    const mouse = d3.mouse(this);
                    const mouseDate = xScale.invert(mouse[0]);
                    const i = bisectDate(data, mouseDate);

                    const d0 = data[i - 1];
                    const d1 = data[i];
                    // work out which date value is closest to the mouse
                    const d = mouseDate - d0[0] > d1[0] - mouseDate ? d1 : d0;

                    const x = xScale(d[0]);
                    const y = yScale(d[1]);

                    focus.select('#focusCircle')
                        .attr('cx', x)
                        .attr('cy', y);

                    focus.select('#focusLineX')
                        .attr('x1', x).attr('y1', yScale(yDomain[0]))
                        .attr('x2', x).attr('y2', yScale(yDomain[1]));

                    focus.select('#focusLineY')
                        .attr('x1', xScale(xDomain[0])).attr('y1', y)
                        .attr('x2', xScale(xDomain[1])).attr('y2', y);
                });

            // warn line

            if (warnLine && yDomain[0] < warnLine.lineValue && yDomain[1] > warnLine.lineValue) {
                g.append('line')
                    .attr('x1', xScale(xDomain[0]))
                    .attr('y1', yScale(warnLine.lineValue))
                    .attr('x2', xScale(xDomain[1]))
                    .attr('y2', yScale(warnLine.lineValue))
                    .attr('class', 'zeroline');

                g.append('text')
                    .attr('x', xScale(xDomain[1]))
                    .attr('y', yScale(warnLine.lineValue))
                    .attr('dy', '1em')
                    .attr('text-anchor', 'end')
                    .text(warnLine.label)
                    .attr('class', 'zerolinetext');
            }
        };

        drawLineGraph(400, 800, data, "Volume", { lineValue: 2000000, label: "threshold!" });
    }
})();
