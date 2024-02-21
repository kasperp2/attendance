<script setup>
import { onMounted, ref } from 'vue';
import { XMarkIcon, CheckIcon, ClockIcon } from '@heroicons/vue/24/solid'
import { useApiStore } from '@/stores/api'

const api = useApiStore()

const selectedDate = ref();
selectedDate.value = new Date().toISOString().slice(0, 10);

const meetingTime = ref();
meetingTime.value = localStorage.getItem("Meeting time") || "";

const meetingTimeAsDate = ref();
updateMeetingTimeDate();

function updateMeetingTimeDate() {
  meetingTimeAsDate.value = new Date(selectedDate.value);
  meetingTimeAsDate.value.setHours(meetingTime.value.slice(0, 2));
  meetingTimeAsDate.value.setMinutes(meetingTime.value.slice(3, 6));
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

  api.req('/attendance/get/' + selectedDate.value)
    .then(data => names.value.forEach(n => {
      let a = data.find(d => d.name_id == n.id)
      if (!a) {
        n.arrivedAt = null
      }
      else {
        n.arrivedAt = a.createdAt
      }
    }))
}

// connect to websocket
const names = ref()
names.value = []

onMounted(() => {
  api.req('/name/get').then(data => names.value = data)

  const socket = api.ws('/attendance')
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    switch (data.action) {
      case 'attendant':
        names.value = names.value.map(n => {
          if (n.id == data.data.name_id) {
            n.arrivedAt = data.data.createdAt
          }
          return n
        })
        break;
    }
  };
  
  dateChange();
})
</script>

<template>
  <div class="rounded-box bg-base-200 mt-4 border border-2 border-base-300"> 
    <div class="collapse-title text-xl font-medium">
      <div class="inline">
        Attendance
      </div>
      <div class="inline flex space-x-5 float-end">
        <input v-model="selectedDate" type="date" @change="dateChange" class="input input-bordered h-9 w-32 p-1 focus:outline-none focus-within:outline-none">
        <input v-model="meetingTime" type="time" @change="timeChange" class="input input-bordered h-9 w-26 pr-1 focus:outline-none focus-within:outline-none" />
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