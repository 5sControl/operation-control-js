# Operation Control JS

# About Operation Control JS
Operation Control is one of the Official [5controlS](https://5controls.com/) algorithm.

Empowers you to monitor and control the execution of technologically necessary number of operations with ease. Our advanced AI algorithms provide real-time insights and predictions, enabling you to optimize your operations for maximum efficiency and profitability.

![video](https://github.com/5sControl/operation-control-js/assets/131950264/6dc7e039-33dd-4b54-ae59-3eb801511134)


## Key features

- ensures window seam trimming operations are completed correctly;
- detects missing operations.

**Plug-in Operation control to 5controlS platform to start monitoring window seam trimming operations!**

# **Project repositories**

The connections between the project repositories are illustrated by the following diagram. 

> Please note that to ensure system stability and perfomance you can use one of the Official 5S algorithms instead of Your Algorithm.

<p align="center">
  <img src="https://github.com/5sControl/5s-backend/assets/131950264/60cbc463-ce88-4af2-a4ed-7e3c01f7a955" alt="5controlS-diagram" />
</p>

**5controlS Platform:**
1. [5s-backend](https://github.com/5sControl/5s-backend)
2. [5s-frontend](https://github.com/5sControl/5s-frontend)
3. [5s-algorithms-controller](https://github.com/5sControl/5s-algorithms-controller)
4. [5s-onvif](https://github.com/5sControl/5s-onvif)
5. [5s-onvif-finder]()

**Official Algorithms:**
1. [min-max](https://github.com/5sControl/min-max)
2. [idle-control](https://github.com/5sControl/idle-control)
3. [operation-control-js](https://github.com/5sControl/operation-control-js)
4. [machine-control](https://github.com/5sControl/machine-control)
5. [machine-control-js](https://github.com/5sControl/machine-control-js)

**Algorithms Servers:**
1. [inference-server-js]()

# **Documentation**

[User Documentation](https://github.com/5sControl/Manufacturing-Automatization-Enterprise/wiki)

# **Contributing**
Thank you for considering contributing to 5controlS. We truly believe that we can build an outstanding product together!

We welcome a variety of ways to contribute. Read below to learn how you can take part in improving 5controlS.

## **Code of conduct**

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## Code contributing

If you want to contribute, read  our [contributing guide](CONTRIBUTING.md) to learn about our development process and pull requests workflow.

We also have a list of [good first issues]() that will help you make your first step to beсoming a 5S contributor.

# **License**

> Please note that [some](Components-with-copyleft-licensies.md) of the Official Algorithms are using copyleft licensies.


<br>
<div align="center">
  <a href="https://5controls.com/" style="text-decoration:none;">
    <img src="https://github.com/5sControl/Manufacturing-Automatization-Enterprise/blob/3bafa5805821a34e8b825df7cc78e00543fd7a58/assets/Property%201%3DVariant4.png" width="10%" alt="" /></a> 
  <img src="https://github.com/5sControl/5s-backend/assets/131950264/d48bcf5c-8aa6-42c4-a47d-5548ae23940d" width="3%" alt="" />
  <a href="https://github.com/5sControl" style="text-decoration:none;">
    <img src="https://github.com/5sControl/Manufacturing-Automatization-Enterprise/blob/3bafa5805821a34e8b825df7cc78e00543fd7a58/assets/github.png" width="4%" alt="" /></a>
  <img src="https://github.com/5sControl/5s-backend/assets/131950264/d48bcf5c-8aa6-42c4-a47d-5548ae23940d" width="3%" alt="" />
  <a href="https://www.youtube.com/@5scontrol" style="text-decoration:none;">
    <img src="https://github.com/5sControl/Manufacturing-Automatization-Enterprise/blob/ebf176c81fdb62d81b2555cb6228adc074f60be0/assets/youtube%20(1).png" width="5%" alt="" /></a>
</div>



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
