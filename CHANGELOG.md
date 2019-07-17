## 0.5.0 (July 17, 2019)

#### BREAKING CHANGES:

* Dropping option for AutoTagging of S3 put from CloudTrail. Only pushing CloudWatch Event bus.

#### FEATURES:

* None (this was primarily a refactor)

#### IMPROVEMENTS:

* Dropping dependency on `co` by moving to `async`/`await`
* Updating dependencies
* Swapping underscore for lodash
* Replacing jscs with eslint
* Dropping grunt
* Improving travis build plan
* Code linting
* Dropping hacky jasmine-es6, using regular jasmine instead with babel-node

#### BUG FIXES:
#### NOTES:

* This is the first big refactor. The goal was to simplify the instructions and modernise the code.