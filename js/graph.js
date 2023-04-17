class Graph {

    /**
     * sort people grouped by countries of birth by page_views, slice the arrays to infoDensityIndex Length
     */
    reduceInfoDensityByCountry(vis){

        let peopleByCountry = d3.group(vis.data, d => d.bplace_country);
        peopleByCountry.forEach(function (value, key, map) {
                let peopleArr = map.get(key)
                if (peopleArr.length > 0, vis.config.infoDensityIndex) {
                    peopleArr.sort(d => d3.descending(d.non_en_page_views))
                    peopleArr = peopleArr.slice(0, vis.config.infoDensityIndex)
                    map.set(key, peopleArr);
                }
            }
        )
        return peopleByCountry;
    }


    /**
     * sort people data by page_views, slice the arrays to infoDensityIndex Length
     */
    reduceInfoDensity(vis){
        if (vis.data.length) {
            vis.data.sort((a, b) => d3.descending(a.non_en_page_views, b.non_en_page_views));
            vis.data = vis.data.slice(0, vis.config.infoDensityIndex);
        }
    }


    /**
     * display person's tooltip with relevant information in both scatterPlot and the Map View
     */
    showPersonTooltip(event, d, vis) {
        const regionName = d.bplace_region_name
        const name = d.name
        const birthPlace = d.bplace_name
        const occupation = d.occupation
        const pageViews = d.non_en_page_views
        const alive = d.alive
        const twitter = d.twitter
        const hasTwitter = twitter !== ''
        const diedIn = d.dplace_name
        const hasDeathPlace = diedIn !== ''
        const isAlive = d.alive === 'True';

        d3.select('#tooltip')
            .style('display', 'block')
            .style('left', event.pageX + vis.tooltipPaddingX + 'px')
            .style('top', event.pageY + vis.tooltipPaddingY + 'px').html(`
      <div class="tooltip-title">${name}</div>
            <div class="tooltip-text">${d.birthyear}  &nbsp - &nbsp  ${isAlive ? '' : d.deathyear}</div>
      <div class="tooltip-text"><li>Birth Place: ${regionName}, ${birthPlace}</li></div>
      <div class="tooltip-text"><li>Occupation: ${occupation}</li></div>
      <div class="tooltip-text"><li>Page views: ${pageViews}</li></div>
      <div class="tooltip-text"><li>Alive: ${alive}</li></div>
      ${hasTwitter ? `<div><li>Twitter account: ${twitter}</li></div>` : ''}
      ${hasDeathPlace ? `<div><li>Died in: ${diedIn}</li></div>` : ''}
        `)
    }

    hideToolTip() {
        d3.select('#tooltip').style('display', 'none')
    }
}
