import test from 'tape';
import stub from 'sinon/lib/sinon/stub'; // avoid babel-register-related error by importing only stub
import featuresAt from '../src/lib/features_at';

const mockContext = {
  options: {},
  map: {
    queryRenderedFeatures: stub().returns([{
      type: 'Feature',
      properties: {
        meta: 'feature'
      },
      geometry: {
        type: 'LineString',
        coordinates: [[0, 0], [1, 1], [2, 2]]
      }
    }, {
      type: 'Feature',
      properties: {
        meta: 'nothing'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[1, 1], [2, 2], [3, 3], [4, 4], [1, 1]]]
      }
    }, {
      type: 'Feature',
      properties: {
        meta: 'vertex'
      },
      geometry: {
        type: 'Point',
        coordinates: [10, 10]
      }
    }])
  }
};

test('featuresAt with bounding box', t => {
  const result = featuresAt(null, [[10, 10], [20, 20]], mockContext);

  t.equal(mockContext.map.queryRenderedFeatures.callCount, 1);
  t.deepEqual(mockContext.map.queryRenderedFeatures.getCall(0).args, [
    [[10, 10], [20, 20]],
    {}
  ]);
  t.deepEqual(result, [{
    type: 'Feature',
    properties: {
      meta: 'vertex'
    },
    geometry: {
      type: 'Point',
      coordinates: [10, 10]
    }
  }, {
    type: 'Feature',
    properties: {
      meta: 'feature'
    },
    geometry: {
      type: 'LineString',
      coordinates: [[0, 0], [1, 1], [2, 2]]
    }
  }], 'sorts, and filters out features with the right properties.meta');

  t.end();
});
