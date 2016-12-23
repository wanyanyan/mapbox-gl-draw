import spy from 'sinon/lib/sinon/spy'; // avoid babel-register-related error by importing only spy

export default function createMockDrawModeContext() {
  var _store = {};

  var api = {
    store: {
      add: function(f) {
        _store[f.id] = f;
      },
      delete: function(id) {
        delete _store[id];
      },
      featureChanged: spy(),
      clearSelected: spy(),
      get: function(id) {
        return _store[id];
      }
    },
    events: {
      changeMode: spy()
    },
    ui: {
      queueMapClasses: spy(),
      setActiveButton: spy()
    },
    map: {
      doubleClickZoom: {
        disable: spy(),
        enable: spy()
      },
      fire: spy()
    },
    _test: {}
  };

  spy(api.store, 'add');
  spy(api.store, 'delete');
  spy(api.store, 'get');

  return api;
}
