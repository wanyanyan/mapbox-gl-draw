var hat = require('hat');
var Constants = require('../constants');

var Feature = function(ctx, geojson) {
  this.ctx = ctx;
  this.properties = geojson.properties || {};
  this.coordinates = geojson.geometry.coordinates;
  this.id = geojson.id || hat();
  this.type = geojson.geometry.type;
};

Feature.prototype.changed = function() {
  this.ctx.store.featureChanged(this.id);
};

Feature.prototype.incomingCoords = function(coords) {
  this.setCoordinates(coords);
};

Feature.prototype.setCoordinates = function(coords) {
  this.coordinates = coords;
  this.changed();
};

Feature.prototype.getCoordinates = function() {
  return JSON.parse(JSON.stringify(this.coordinates));
};

//wanyanyan 2016/11/09 设置属性
Feature.prototype.setProperty = function(name,value){
  this.properties[name] = value;
};

Feature.prototype.toGeoJSON = function() {
  return JSON.parse(JSON.stringify({
    id: this.id,
    type: Constants.geojsonTypes.FEATURE,
    properties: this.properties,
    geometry: {
      coordinates: this.getCoordinates(),
      type: this.type
    }
  }));
};

Feature.prototype.internal = function(mode) {
  var properties = {
    id: this.id,
    meta: Constants.meta.FEATURE,
    'meta:type': this.type,
    active: Constants.activeStates.INACTIVE,
    mode: mode
  };
  //wanyanyan 2016/11/09 设置属性（修改）
  for(var name in this.properties){
    properties[name] = this.properties[name];
  }
  return {
    type: Constants.geojsonTypes.FEATURE,
    properties: properties,
    geometry: {
      coordinates: this.getCoordinates(),
      type: this.type
    }
  };
};

module.exports = Feature;
