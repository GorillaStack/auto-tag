import SutClass from '../../src/workers/autotag_s3_worker';

describe('autotag_s3_worker', () => {
  it('is a function', () => {
    expect(typeof SutClass).toBe('function');
  });

  describe('touchReservedTagKeys', () => {
    const tagsForCFCreatedBucketBefore = [
      { Key: 'aws:cloudformation:logical_id', Value: 'This API is so illogical.' },
      { Key: 'aws:cloudformation:physical_id', Value: 'Sucks to be you S3 API user.' },
      { Key: 'shouldnttouch', Value: 'Should be identity function.' },
      { Key: 'asw:shouldnttouch', Value: 'Should be identity function.' }
    ];

    const tagsForCFCreatedBucketAfter = [
      { Key: 'at_aws:cloudformation:logical_id', Value: 'This API is so illogical.' },
      { Key: 'at_aws:cloudformation:physical_id', Value: 'Sucks to be you S3 API user.' },
      { Key: 'shouldnttouch', Value: 'Should be identity function.' },
      { Key: 'asw:shouldnttouch', Value: 'Should be identity function.' }
    ];

    let sut = null;

    beforeAll(() => {
      sut = new SutClass();
    });

    it('prefixes reserved tag keys with at_', () => {
      expect(sut.touchReservedTagKeys(tagsForCFCreatedBucketBefore))
        .toEqual(tagsForCFCreatedBucketAfter);
    });
  });
});
