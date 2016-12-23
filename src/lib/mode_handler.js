var ModeHandler = function(mode, DrawContext) {

  var handlers = {
    drag: [],
    click: [],
    mousemove: [],
    mousedown: [],
    mouseup: [],
    mouseout: [],
    keydown: [],
    keyup: []
  };

  var ctx = {
    on: function(event, selector, fn) {
      if (handlers[event] === undefined) {
        throw new Error("Invalid event type: "+event);
      }
      handlers[event].push({
        selector: selector,
        fn: fn
      });
    },
    render: function(id) {
      DrawContext.store.featureChanged(id);
    }
  };

  var delegate = function (eventName, event) {
    var handles = handlers[eventName];
    var iHandle = handles.length;
    while (iHandle--) {
      var handle = handles[iHandle];
      if (handle.selector(event)) {
        handle.fn.call(ctx, event);
        DrawContext.store.render();
        DrawContext.ui.updateMapClasses();

        // ensure an event is only handled once
        // we do this to let modes have multiple overlapping selectors
        // and relay on order of oppertations to filter
        break;
      }
    }
  };

  mode.start.call(ctx);

  return {
    render: mode.render,
    stop: function() {
      if (mode.stop) mode.stop();
    },
    trash: function() {
      if (mode.trash) {
        mode.trash();
        DrawContext.store.render();
      }
    },
    drag: function(event) {
      delegate('drag', event);
    },
    click: function(event) {
      delegate('click', event);
    },
    mousemove: function(event) {
      delegate('mousemove', event);
    },
    mousedown: function(event) {
      delegate('mousedown', event);
    },
    mouseup: function(event) {
      delegate('mouseup', event);
    },
    mouseout: function(event) {
      delegate('mouseout', event);
    },
    keydown: function(event) {
      delegate('keydown', event);
    },
    keyup: function(event) {
      delegate('keyup', event);
    }
  };
};

module.exports = ModeHandler;
