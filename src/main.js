// @ts-nocheck
Spotfire.initialize(async function(mod) {
    // Get the visualization element
    const vizElem = document.querySelector(".visualization"); // Visualization target
    
    // Get the render context
    const context = mod.getRenderContext();

    // Pod count
    const podCount = 50;


    // --------------------------------------------------------------------------------
    // SPOTFIRE DEFINITIONS
    let rows = null;
    let axes = {};

    // --------------------------------------------------------------------------------
    // VIZ DATA AND CONFIG
    let data = [];

    // Get pods element
    let podsElem = document.querySelector("div.pods");
    podsElem.innerHTML = '';

    // Create individual pods
    let podsElemArr = [];
    for(let idx = 0; idx < podCount; idx++) {
        let podElem = document.createElement("div");
        podElem.classList.add("pod");
        podsElem.appendChild(podElem);     
        podsElemArr.push(podElem);           
    }

    // --------------------------------------------------------------------------------
    // DATA FUNCTIONS
    
    let axisHasExpression = function(name) {
        let axis = axes[name];
        if(axis != null && axis.parts != null && axis.parts.length > 0)
            return true;
        return false;
    }
    // --------------------------------------------------------------------------------
    // ViZ FUNCTIONS
    // Converts data rows into objects
    let processRows = function() {
        if(rows == null) return;

        // Reset arrays
        data = [];

        // Iterate over rows and push into arrays
        rows.forEach(function(row) {
            let consignment = {
                consignmentUnits: axisHasExpression("Consignment Units") ? row.continuous("Consignment Units").formattedValue() : 0,
                orderBy: axisHasExpression("Order by") ? row.categorical("Order by").formattedValue() : null,
                vehicleCapacity: axisHasExpression("Vehicle Capacity") ? row.continuous("Vehicle Capacity").formattedValue() : 0,
                cabOpen: axisHasExpression("Cab Open") ? row.categorical("Cab Open").formattedValue() : false,
                cargoOpen: axisHasExpression("Cargo Open") ? row.categorical("Cargo Open").formattedValue() : false,
                colorBy: row.color().hexCode
            }

            data.push(consignment);
        });

        // Sort by order by
        data.sort(function(a, b){ 
            let dir = 1;
            let val = a.orderBy > b.orderBy ? 1 : a.orderBy < b.orderBy ? -1 : 0;
            return dir * val;
        });
    }

    // Draws the visualization
    let drawViz = function() {
        let cabOpen = false;
        let cargoOpen = false;
        let vehicleCapacity = 0;

        if(data.length > 0) {
            cabOpen = data[0].cabOpen;
            cargoOpen = data[0].cargoOpen;
            vehicleCapacity = data[0].vehicleCapacity;
        }

        // Get cab door element
        let cabElem = document.querySelector("g.cab");
        cabElem.classList.remove("open");
        cabElem.classList.remove("closed");
        cabElem.classList.add(cabOpen == "True" ? "open" : "closed");

        // Get cargo door element
        let cargoElem = document.querySelector("g.cargo");
        cargoElem.classList.remove("open");
        cargoElem.classList.remove("closed");
        cargoElem.classList.add(cargoOpen == "True" ? "open" : "closed");

        let lastPodIndex = 0;
        for(let dataIdx = 0; dataIdx < data.length; dataIdx++) {
            let thisData = data[dataIdx];
            let thisPodCount = Math.round(thisData.consignmentUnits / thisData.vehicleCapacity * podCount);
            let endPodIndex = Math.min(lastPodIndex + thisPodCount, 50);
            for(let podIdx = lastPodIndex; podIdx < endPodIndex; podIdx++) {
                podsElemArr[podIdx].style.backgroundColor = thisData.colorBy;
            }
            lastPodIndex = endPodIndex;
        }

        for(let podIdx = lastPodIndex; podIdx < podsElemArr.length; podIdx++) {
            podsElemArr[podIdx].style.backgroundColor = "";
        }
    }

 
 
    // --------------------------------------------------------------------------------
    // DATA EVENT HANDLER

    // Create a read function for data changes
    let readData = mod.createReader(
        mod.visualization.axis("Consignment Units"),
        mod.visualization.axis("Order by"),
        mod.visualization.axis("Vehicle Capacity"),
        mod.visualization.axis("Cab Open"),
        mod.visualization.axis("Cargo Open"),
        mod.visualization.data()
    );

    // Call the read function to schedule an onChange callback (one time)
    readData.subscribe(async function onChange(consignmentUnitsView, orderByView, vehicleCapacityView, cabOpenView, cargoOpenView, dataView) {
        axes[consignmentUnitsView.name] = consignmentUnitsView;
        axes[orderByView.name] = orderByView;
        axes[vehicleCapacityView.name] = vehicleCapacityView;
        axes[cabOpenView.name] = cabOpenView;
        axes[cargoOpenView.name] = cargoOpenView;

        // Get all rows and process
        rows = await dataView.allRows();    

        // Process rows to objects
        processRows();

        // Draw viz
        drawViz();

        // Complete render
        context.signalRenderComplete();
    });

    // Create a read function for window size
    let readWindow = mod.createReader(
        mod.windowSize()
    );

    // Subscribe to window size changes and take action
    readWindow.subscribe(async function onChange(windowSize){
        // Redraw
        drawViz();

        // Complete render
        context.signalRenderComplete();
    });

}); // end Spotfire

