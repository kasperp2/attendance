<script setup>
import { onMounted, ref } from 'vue';

// connect to websocket
const socket = new WebSocket('ws://192.168.0.117:3000/attendance')
const attendances = ref()
const names = ref()
const newName = ref()

attendances.value = []
names.value = []

onMounted(async () => {
    socket.onmessage = (event) => {
      var command = JSON.parse(event.data);
      console.log(command);
    };

    fetch('http://192.168.0.117:3000/name/get')
      .then(response => response.json())
      .then(data => names.value = data)
})

const createName = () => {
  fetch('http://192.168.0.117:3000/name/create/' + newName.value)
  .then(response => response.json())
	.then(data => names.value = [...names.value, data])
}

const writeName = (nameId) => {
  fetch('http://192.168.0.117:3000/name/write/' + nameId)
}
</script>

<template>
  <div class="join">
    <input type="text" class="input input-bordered join-item" name="name" placeholder="full name" v-model="newName" />
    <button @click="createName" class="btn btn-primary join-item">create</button>
  </div>

  <div class="collapse bg-base-200 mt-4">
    <input type="checkbox" /> 
    <div class="collapse-title text-xl font-medium">
      Names
    </div>
    <div class="collapse-content"> 
      <div class="grid gap-4">
        <div v-for="(name, i) in names" class="join">
          <div class="join-item input bg-neutral align-baseline">{{ name.name }} </div>
          <button @click="writeName(name.id)" class="btn btn-secondary join-item">write</button>
          <button @click="writeName(name.id)" class="btn btn-error join-item">X</button>
        </div>
      </div>
    </div>
  </div>

  <div class="collapse bg-base-200 mt-4">
    <input type="checkbox" /> 
    <div class="collapse-title text-xl font-medium">
      Attendance
    </div>
    <div class="collapse-content">
      <table class="table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Came</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(attendance, i) in attendances">
            <th>{{ i }}</th>
            <td>{{attendance.name}}</td>
            <td>Blue</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>