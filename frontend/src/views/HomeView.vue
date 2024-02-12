<script setup>
import { onMounted, ref } from 'vue';
import { XMarkIcon, CheckIcon, ClockIcon } from '@heroicons/vue/24/solid'

// const ip = 'rspi.local:3000';
const ip = '192.168.0.117:3000';

const selectedDate = ref();
selectedDate.value = new Date().toISOString().slice(0, 10);

const meetingTime = ref();
meetingTime.value = localStorage.getItem("Meeting time") || ref();

let meetingTimeAsDate;
updateMeetingTimeDate();

function updateMeetingTimeDate() {
  meetingTimeAsDate = new Date(selectedDate.value);
  meetingTimeAsDate.setHours(meetingTime.value.slice(0, 2));
  meetingTimeAsDate.setMinutes(meetingTime.value.slice(3, 6));
}

function timeChange() {
  localStorage.setItem("Meeting time", meetingTime.value);
  updateMeetingTimeDate();
}

function getTime(date) {
  date = new Date(date);
  let time = date.toLocaleTimeString().slice(0, 5);
  return time;
}

async function dateChange() {
  updateMeetingTimeDate();
  await fetch('http://'+ip+'/attendance/get/' + selectedDate.value)
  .then(response => response.json())
  .then(data => names.value.forEach(n => {
    let a = data.find(d => d.name_id == n.id)
    if (!a) {
      n.arrivedAt = null
    }
    else {
      n.arrivedAt = a.createdAt
    }
  })
  )
}

// connect to websocket
const names = ref()
names.value = []

onMounted(async () => {
  await fetch('http://'+ip+'/name/get')
    .then(response => response.json())
    .then(data => names.value = data)

  const socket = new WebSocket('ws://'+ip+'/attendance')
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    switch (data.action) {
      case 'attendant':
        names.value = names.value.map(n => {
          if (n.id == data.data.name_id) {
            speak('velkommen ' + n.name)
            n.arrivedAt = data.data.createdAt
          }
          return n
        })
        break;
    }
  };
  
  dateChange();
})

const speak = (text) => {
  var msg = new SpeechSynthesisUtterance();
  msg.text = text;
  msg.lang = 'da';
  speechSynthesis.speak(msg);
}
</script>

<template>
  <div class="rounded-box bg-base-200 mt-4"> 
    <div class="collapse-title text-xl font-medium">
      <div class="inline">
        Attendance
      </div>
      <div class="inline flex space-x-5 float-end">
        <input v-model="selectedDate" type="date" @change="dateChange" class="input input-bordered h-9 w-32 p-1 focus:outline-none focus-within:outline-none">
        <input v-model="meetingTime" type="time" @change="timeChange" class="input input-bordered h-9 w-24 pr-1 focus:outline-none focus-within:outline-none" />
      </div>
    </div>
    <div class="rounded-box overflow-x-auto">
      <table class="table table-zebra bg-base-100">
        <thead class="bg-base-200">
          <tr>
            <th>Present</th>
            <th>Name</th>
            <th>Arrived</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(name) in names" class="">
            <td class="whitespace-nowrap w-0 text-center">
              <label class="swap swap-rotate">
                <div :class="'text-error swap-'+(name.arrivedAt ? 'on' : 'off')"><XMarkIcon class="h-6 w-6 hover:cursor-default"/></div>
                <div :class="'text-success swap-'+(name.arrivedAt && (getTime(name.arrivedAt) <= getTime(meetingTimeAsDate)) ? 'off' : 'on')"><CheckIcon class="h-6 w-6 hover:cursor-default"/></div>
                <div :class="'text-warning swap-'+(name.arrivedAt && (getTime(name.arrivedAt) > getTime(meetingTimeAsDate)) ? 'off' : 'on')"><ClockIcon class="h-6 w-6 hover:cursor-default"/></div>
              </label> 
            </td>
            <td>{{ name.name }}</td>
            <td v-if="name.arrivedAt">{{ (getTime(name.arrivedAt)) }}</td>
            <td v-else>-</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>