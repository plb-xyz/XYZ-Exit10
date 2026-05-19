<div style="text-align: center;">Slider</div>
<input ng-init="output(msg)" class="sliderV size2x6" type="range" min=0 max=100 step=1 ng-model="msg.payload" aria-label="volume" ng-change="output(msg)">

<script>
(function($scope) {
    $scope.output = function(key) {
        if ($scope.hasOwnProperty("msg")){
            if ($scope.msg.hasOwnProperty("socketid") || $scope.msg.payload !== 50){ //this prevents output at 50% from initialization on ng-change
		        $scope.send({payload:$scope.msg.payload, socketid:$scope.msg.socketid});
            }
        }
        
    };
})(scope);
</script>

<style>
input[type='range'].sliderH {
  margin-top: 60px;
  width: 80px;
  height: 240px;
  padding: 0;
  overflow: unset;
  cursor: grab;
}
input[type='range'].sliderV {
  transform: rotateZ(-90deg);
  margin-top: 60px;
  writing-mode: bt-lr;
  width: 80%;
  padding: 0;
  overflow: unset;
  cursor: grab;
  height: 8px;
  margin-left: -100px;
}
.size1x6 {
    height: 8px !important;
    margin-left: -100px !important;
}
.size2x6 {
    height: 13px !important;
    margin-left: -80px !important;
}
.size1x6::-webkit-slider-thumb {
    height: 23px !important;
    width: 42px !important;
}
.size2x6::-webkit-slider-thumb{
    height: 43px !important;
    width: 72px !important;
}
@media screen and (-webkit-min-device-pixel-ratio: 0) {
  input[type='range'].sliderH {
    -webkit-appearance: none;
    width: 240px;
    height: 10px;
    margin-top: 30px;
    margin-left: 30px;
    outline: 0;
    border-radius: 5px;
    background-color: #0b0b0b;
    box-shadow: inset 1px 1px 0 1px #6d6d6d;
  }
}
@media screen and (-webkit-min-device-pixel-ratio: 0) {
  input[type='range'].sliderV {
    -webkit-appearance: none;
    -webkit-transform: rotate(270deg);
    width: 240px;
    height: 10px;
    margin-top: 140px;
    outline: 0;
    border-radius: 5px;
    background-color: #0b0b0b;
    box-shadow: inset 1px 1px 0 1px #6d6d6d;
  }
}
input[type='range']::-ms-track {
  width: 10px;
  height: 240px;
  border-radius: 5px;
  background-color: #0b0b0b;
  box-shadow: inset 1px 1px 0 1px #6d6d6d;
  border: 0;
}
input[type='range']::-moz-range-track {
    transform: rotateZ(-90deg);
  width: 10px;
  height: 240px;
  border-radius: 5px;
  background-color: #0b0b0b;
  box-shadow: inset 1px 1px 0 1px #6d6d6d;
  border: 0;
}
input[type='range']::-webkit-slider-thumb {
  width: 72px;
  height: 32px;
  -webkit-appearance: none;
  background-image: -webkit-linear-gradient(left, #0f0f0f, #2e2e2e 4%, #0f0f0f 8%, #000 47%, #808080 48%, #808080 52%, #000 53%, #1a1a1a 96%, #2e2e2e);
  box-shadow: 5px -10px 20px 0 #1a1a1a;
}
input[type='range']::-ms-thumb {
  width: 32px;
  height: 72px;
  border: 0;
  box-shadow: -10px -5px 20px 0 #1a1a1a;
  background-image: -ms-linear-gradient(bottom, #0f0f0f, #2e2e2e 4%, #0f0f0f 8%, #000 47%, #808080 48%, #808080 52%, #000 53%, #1a1a1a 96%, #2e2e2e);
}
input[type='range']::-ms-tooltip {
  display: none;
}
input[type='range']::-moz-range-thumb {
  width: 32px;
  height: 72px;
  border: 0;
  box-shadow: -10px -5px 20px 0 #1a1a1a;
  background-image: -moz-linear-gradient(bottom, #0f0f0f, #2e2e2e 4%, #0f0f0f 8%, #000 47%, #808080 48%, #808080 52%, #000 53%, #1a1a1a 96%, #2e2e2e);
  border-radius: 0;
  transform: rotateZ(-90deg);
}
</style>