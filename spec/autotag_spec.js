import requireMock from 'mock-require';
import each from 'lodash/each';
import cloudTrailEventConfig from '../src/cloud_trail_event_config';

let sut = null;
let constructorFlag = false;
let executeFlag = false;
const AwsCloudTrailListenerMock = class {
  constructor() {
    constructorFlag = true;
  }

  execute() {
    executeFlag = true;
  }
};

each(cloudTrailEventConfig, (value, key) => {
  AwsCloudTrailListenerMock[key] = value;
});

describe('AutoTag index file', () => {
  beforeAll(() => {
    requireMock(
      '../src/aws_cloud_trail_event_listener',
      AwsCloudTrailListenerMock
    );
    sut = require('../src/autotag_event'); // eslint-disable-line global-require
  });

  afterAll(() => {
    requireMock.stopAll();
  });

  it('should define a function called "handler"', () => {
    expect(sut).not.toBeUndefined();
    expect(sut.handler).not.toBeUndefined();
  });

  describe('autotag_event.handler', () => {
    beforeAll(() => {
      sut.handler();
    });

    it('creates an "AwsCloudTrailListener" object', () => {
      expect(constructorFlag).toBeTruthy();
    });

    it('invokes a method "execute"', () => {
      expect(executeFlag).toBeTruthy();
    });
  });
});
