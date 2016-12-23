const xtend = require('xtend');
const Constants = require('./constants');

const classTypes = ['mode', 'feature', 'mouse'];

module.exports = function(ctx) {

  const buttonElements = {};
  var activeButton = null;

  var currentMapClasses = {
    mode: null, // e.g. mode-direct_select
    feature: null, // e.g. feature-vertex
    mouse: null // e.g. mouse-move
  };

  var nextMapClasses = {
    mode: null,
    feature: null,
    mouse: null
  };

  function queueMapClasses(options) {
    nextMapClasses = xtend(nextMapClasses, options);
  }

  function updateMapClasses() {
    if (!ctx.container) return;

    const classesToRemove = [];
    const classesToAdd = [];

    classTypes.forEach(function(type) {
      if (nextMapClasses[type] === currentMapClasses[type]) return;

      classesToRemove.push(type+"-"+currentMapClasses[type]);
      if (nextMapClasses[type] !== null) {
        classesToAdd.push(type+"-"+nextMapClasses[type]);
      }
    });

    if (classesToRemove.length > 0) {
      ctx.container.classList.remove.apply(ctx.container.classList, classesToRemove);
    }

    if (classesToAdd.length > 0) {
      ctx.container.classList.add.apply(ctx.container.classList, classesToAdd);
    }

    currentMapClasses = xtend(currentMapClasses, nextMapClasses);
  }

  function createControlButton(id, options) {
    if(options===undefined){options={};}
    const button = document.createElement('button');
    button.className = Constants.classes.CONTROL_BUTTON+" "+options.className;
    button.setAttribute('title', options.title);
    options.container.appendChild(button);

    button.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();

      const clickedButton = e.target;
      if (clickedButton === activeButton) {
        deactivateButtons();
        return;
      }

      setActiveButton(id);
      options.onActivate();
    }, true);

    return button;
  }

  function deactivateButtons() {
    if (!activeButton) return;
    activeButton.classList.remove(Constants.classes.ACTIVE_BUTTON);
    activeButton = null;
  }

  function setActiveButton(id) {
    deactivateButtons();

    const button = buttonElements[id];
    if (!button) return;

    if (button && id !== 'trash') {
      button.classList.add(Constants.classes.ACTIVE_BUTTON);
      activeButton = button;
    }
  }

  function addButtons() {
    const controls = ctx.options.controls;
    if (!controls) return;

    const ctrlPosClassName = String(Constants.classes.CONTROL_PREFIX)+String(ctx.options.position) || 'top-left';
    var controlContainer = ctx.container.getElementsByClassName(ctrlPosClassName)[0];
    if (!controlContainer) {
      controlContainer = document.createElement('div');
      controlContainer.className = ctrlPosClassName;
      ctx.container.appendChild(controlContainer);
    }

    var controlGroup = controlContainer.getElementsByClassName(Constants.classes.CONTROL_GROUP)[0];
    if (!controlGroup) {
      controlGroup = document.createElement('div');
      controlGroup.className = Constants.classes.CONTROL_GROUP+" "+Constants.classes.CONTROL_BASE;

      const attributionControl = controlContainer.getElementsByClassName(Constants.classes.ATTRIBUTION)[0];
      if (attributionControl) {
        controlContainer.insertBefore(controlGroup, attributionControl);
      } else {
        controlContainer.appendChild(controlGroup);
      }
    }

    if (controls[Constants.types.LINE]) {
      buttonElements[Constants.types.LINE] = createControlButton(Constants.types.LINE, {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_LINE,
        title: "LineString tool "+(ctx.options.keybindings && '(l)'),
        onActivate: function(){ctx.events.changeMode(Constants.modes.DRAW_LINE_STRING);}
      });
    }

    if (controls[Constants.types.POLYGON]) {
      buttonElements[Constants.types.POLYGON] = createControlButton(Constants.types.POLYGON, {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_POLYGON,
        title: "Polygon tool "+(ctx.options.keybindings && '(p)'),
        onActivate: function(){ ctx.events.changeMode(Constants.modes.DRAW_POLYGON);}
      });
    }

    if (controls[Constants.types.POINT]) {
      buttonElements[Constants.types.POINT] = createControlButton(Constants.types.POINT, {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_POINT,
        title: "Marker tool "+(ctx.options.keybindings && '(m)'),
        onActivate: function(){ ctx.events.changeMode(Constants.modes.DRAW_POINT);}
      });
    }

    if (controls.trash) {
      buttonElements.trash = createControlButton('trash', {
        container: controlGroup,
        className: Constants.classes.CONTROL_BUTTON_TRASH,
        title: 'Delete',
        onActivate: function(){
          ctx.events.trash();
        }
      });
    }
  }

  function removeButtons() {
    Object.keys(buttonElements).forEach(function(buttonId){
      const button = buttonElements[buttonId];
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
      delete buttonElements[buttonId];
    });
  }

  return {
    setActiveButton:setActiveButton,
    queueMapClasses:queueMapClasses,
    updateMapClasses:updateMapClasses,
    addButtons:addButtons,
    removeButtons:removeButtons
  };
};
