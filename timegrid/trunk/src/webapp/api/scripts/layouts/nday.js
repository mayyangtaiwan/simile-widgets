/******************************************************************************
 * NDayLayout
 * @fileoverview
 *   This is where the n-day layout is defined.  The layout is designed to 
 *   resemble the equivalent Google Calendar view.
 * @author masont
 *****************************************************************************/
 
 /**
  * Constructs an NDayLayout object.
  * @class NDayLayout is a subclass of Layout that implements an n-day event
  *     calendar, modeled off of the weekly view found in Google Calendar.
  * @extends Timegrid.Layout
  * @constructor
  */
Timegrid.NDayLayout = function(eventSource, params) {
    Timegrid.NDayLayout.superclass.call(this, eventSource, params);
    var self = this;
    
    // Specifications for a week layout
    this.xSize = 7;
    this.ySize = 24;
    this.iterable = true;
    this.xMapper = function(obj) { return (new SimileAjax.DateTime.Interval(obj.time - self.startTime)).days; };
    this.yMapper = function(obj) { return obj.time.getHours(); };
    
    // These are default values that can be overridden in configure
    this.height = 500.0;
    this.n      = 3;
    
    this.configure(params);
    this.title = this.n + "-Day";
    this.xSize = this.n;
    this.computeCellSizes();
    
    // Initialize our eventSource
    this.eventSource = eventSource;
    this.startTime = new Date(this.eventSource.getEarliestDate()) || new Date();
    this.startTime.setHours(0);
    this.endTime = this.computeEndTime(this.startTime); 
    this.initializeGrid();
};
Timegrid.LayoutFactory.registerLayout("n-day", Timegrid.NDayLayout);

Timegrid.NDayLayout.prototype.initializeGrid = function() {
    this.eventGrid = new Timegrid.Grid([], this.xSize, this.ySize, 
                                       this.xMapper, this.yMapper);
    if (this.startTime) {
        var iterator = this.eventSource.getEventIterator(this.startTime,
                                                         this.endTime);
        console.log(this.startTime, this.endTime);
        while (iterator.hasNext()) {
            var endpoints = Timegrid.NDayLayout.getEndpoints(iterator.next());
            this.eventGrid.addAll(endpoints);
        }
    }
};

Timegrid.NDayLayout.prototype.renderEvents = function(doc) {
    var eventContainer = doc.createElement("div");
    $(eventContainer).addClass("timegrid-events");
    var currentEvents = {};
    var currentCount = 0;
    for (x = 0; x < this.xSize; x++) {
        for (y = 0; y < this.ySize; y++) {
            var endpoints = this.eventGrid.get(x,y);
            for (i in endpoints) {
                var endpoint = endpoints[i];
                if (endpoint.type == "start") {
                    // Render the event
                    var eventDiv = this.renderEvent(endpoint.event, x, y);
                    eventContainer.appendChild(eventDiv);
                    // Push the event div onto the current events set
                    currentEvents[endpoint.event.getID()] = eventDiv;
                    currentCount++;
                    // Adjust widths and offsets as necessary
                    var hIndex = 0;
                    for (id in currentEvents) {
                        var eDiv = currentEvents[id];
                        var newWidth = this.xCell / currentCount;
                        $(eDiv).css("width", newWidth + "%");
                        $(eDiv).css("left", this.xCell * x + newWidth * hIndex + "%");
                        hIndex++;
                    }
                } else if (endpoint.type == "end") {
                    // Pop event from current events set
                    delete currentEvents[endpoint.event.getID()];
                    currentCount--;
                }
            }
        }
    }
    return eventContainer;
};

Timegrid.NDayLayout.prototype.renderEvent = function(evt, x, y) {
    var jediv = $("<div>" + evt.getText() + "</div>");
    jediv.addClass("timegrid-event");
    jediv.css("height", this.yCell * evt.getInterval().hours);
    jediv.css("top", this.yCell * y);
    jediv.css("left", this.xCell * x + '%');
    return jediv.get()[0]; // Return the actual DOM element
};

Timegrid.NDayLayout.prototype.getXLabels = function() {
    var date = new Date(this.startTime);
    var labels = [];
    while (date < this.endTime) {
        labels.push(Date.abbrDayNames[date.getDay()] + " " + this.renderDate(date));
        date.setHours(24);
    }
    return labels;
};

Timegrid.NDayLayout.prototype.getYLabels = function() {
    return [ "12am", "1am", "2am", "3am", "4am", "5am", "6am", "7am", "8am",
             "9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm", "4pm", "5pm",
             "6pm", "7pm", "8pm", "9pm", "10pm", "11pm" ];
};

Timegrid.NDayLayout.prototype.goPrevious = function() {
    this.endTime = this.startTime;
    this.startTime = this.computeStartTime(this.endTime);
    this.initializeGrid();
    this.render();
};

Timegrid.NDayLayout.prototype.goNext = function() {
    this.startTime = this.endTime;
    this.endTime = this.computeEndTime(this.startTime);
    this.initializeGrid();
    this.render();
};

Timegrid.NDayLayout.prototype.getCurrent = function() {
    this.endTime.addSeconds(-1);
    var result = this.renderDate(this.startTime) + " - " + this.renderDate(this.endTime);
    this.endTime.addSeconds(1);
    return result;
};

Timegrid.NDayLayout.prototype.renderDate = function(date) {
    return (date.getMonth() + 1) + "/" + date.getDate();
};

Timegrid.NDayLayout.prototype.computeStartTime = function(date) {
    if (date) {
        var startTime = new Date(date);
        startTime.addDays(0 - this.n);
        startTime.setHours(0);
        return startTime;
    }
    return false;
};

Timegrid.NDayLayout.prototype.computeEndTime = function(date) {
    if (date) {
        var endTime = new Date(date);
        endTime.addDays(this.n);
        endTime.setHours(0);
        return endTime;
    }
    return false;
};

Timegrid.NDayLayout.getEndpoints = function(evt) {
    return [ { type: "start",
               time: evt.getStart(),
               event: evt },
             { type: "end",
               time: evt.getEnd(),
               event: evt } ];
};
