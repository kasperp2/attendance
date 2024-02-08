<script setup>
import { onMounted, ref } from 'vue';

const ip = 'rspi.local:3000';

const socket = new WebSocket('ws://'+ip+'/sense')
const pixels = ref()
const color = ref()
color.value = '#ff0000'
const colors = 10

let mouseDown = false;


function clear(){
    pixels.value.fill([0,0,0])

    const message = JSON.stringify({
        action: 'clear',
        data: true
    })
    socket.send(message) 
}

function setLed(i){
    const c = hex2rgb(color.value)

    if(c == pixels.value[i]) return
    console.log(c, pixels.value[i]);
    
    pixels.value[i] = c

    const x = i % 8
    const y = Math.floor(i / 8)

    const message = JSON.stringify({
        action: 'set_pixel',
        data: [x, y, c[0], c[1], c[2]]
    })
    socket.send(message) 
}

const hex2rgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return [r, g, b]
}

const hsl2Hex = (h, s, l) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

onMounted(()=>{
    socket.onmessage = (event) => {        
        pixels.value = JSON.parse(event.data)
    };

    document.body.onmousedown = () => mouseDown = true
    document.body.onmouseup = () => mouseDown = false
})
</script>

<template>
<div class="buttons">
    <button v-for="i in colors" @click="color = hsl2Hex((360 / colors) * i, 100, 50)" :style="'background-color: hsl('+((360 / colors) * i)+' 100% 50%);'"></button>
    <button class="btn" @click="clear()">clear</button>
</div>
<br>
<br>

<div class="grid">
    <div class="led" v-for="(color, i) in pixels" :key="i" @mousedown="setLed(i)" @mouseover="mouseDown ? setLed(i) : false" 
        :style="'background-color:rgb('+color[0]+','+color[1]+','+color[2]+')'"></div>
</div>

</template>

<style scoped>
.grid {
    display: grid;
    grid-template: repeat(8, 1fr) / repeat(8, 1fr);
    width: fit-content
}
.led {
    height: 50px;
    width: 50px;
    border: 2px solid rgb(255, 255, 255);
}
.buttons button{
    width: 50px;
    height: 50px;
}
</style>
