# Operation Control JS

## Changelog:
`🪟 Corner cleaning algorithm version (integrate to) ->  🐋 5sControl-docker version`

**14.06.2023**
🪟 v1.0.0-rc.2 -> 🐋 0.4.1

algorithm

+ fix: don't find worker detection in undefined detections from "window+worker" model

report

+ fix: correct sequence of drawing corners on photos
+ fix: does not always draw points
+ fix: if the processed corners are not equal to 4 - mark the report as incorrect
+ chore: chronological order of the report photos
+ chore: add start&end photos

**06.06.2023**
🪟 v1.0.0-rc.1 -> 🐋 0.4.0
+ new model processing chain
+ new models for window&worker and recognition of operations
+ additional check to see if the operation is within the window
+ new design of photos in reports

**05.25.2023**
🪟 0.3.1 -> 🐋 0.3.7
+ updated models
+ reducing rendering time and saving debug photos
+ moving the debugger logic into a separate module

🪟 0.3.0 -> 🐋 0.3.5
+ model detection at workerpool
