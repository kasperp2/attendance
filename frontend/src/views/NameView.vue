<script setup>
import { onMounted, ref } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/solid'
import { useApiStore } from '@/stores/api'

const api = useApiStore()

const names = ref([])
const newName = ref('')

const cardWriteId = ref('')
const identifying = ref(false)
const identifiedId = ref('')

onMounted(async () => {
  api.req('/name/get').then(data => names.value = data)

  const socket = api.ws('/attendance')
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    switch (data.action) {
      case 'card/confirm':
        names.value.find(n => n.id == cardWriteId.value).card_assigned = true
        cardWriteId.value = null
        break;

      case 'card/identify':
        identifying.value = false
        identifiedId.value = data
        break;
    }
  };
})

const createName = () => {
  api.req('/name/create/' + newName.value).then(data => names.value = [...names.value, data])
}

const removeName = (nameId) => {
  api.req('/name/remove/' + nameId)
  names.value = names.value.filter(n => n.id != nameId)
}

const writeName = (nameId) => {
  cardWriteId.value = nameId
  api.req('/name/write/' + nameId)
}

const identifyCard = () => {
  api.req('/name/identify')

}

const nameToRemove = ref([])
</script>

<template>
  <div class="join">
    <input type="text" class="input input-bordered join-item" name="name" placeholder="full name" v-model="newName" />
    <button @click="createName" class="btn btn-primary join-item">create</button>
  </div>


  <button @click="identifyCard" class="btn btn-secondary float-end">Identify Card {{ identifiedId }}</button>
  
  <div class="collapse collapse-open bg-base-200 mt-4">
    <input type="checkbox" /> 
    <div class="collapse-title text-xl font-medium">
      Names
    </div>
    <div class="collapse-content"> 
      <div class="grid gap-4">
        <div v-for="(name, i) in names" class="join">
          <div class="join-item input bg-base-100 flex items-center ">{{ name.name }}</div>
          <button @click="writeName(name.id)" :class="'btn join-item ' + (name.card_assigned ? 'btn-success' : 'btn-primary')">
            <div v-if="name.id == cardWriteId"><span class="loading loading-ring loading-lg"></span></div>
            <div v-else-if="name.card_assigned">assigned</div>
            <div v-else>write</div>
          </button>
          <button @click="() => {nameToRemove.value = name}" class="btn btn-error join-item" onclick="remove_modal.showModal()"><XMarkIcon class="h-6 w-6"/></button>
        </div>
      </div>
    </div>
  </div>
  
  <dialog id="remove_modal" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg">You Are About To Remove {{ nameToRemove?.value?.name }}?</h3>
      <p class="py-4">This will remove all records related to {{ nameToRemove?.value?.name }} permanently!<br>This action can NOT be undone!</p>
      <div class="modal-action">
        <form method="dialog">
          <button class="btn">Cancel</button>
          <button class="btn btn-error" @click="removeName(nameToRemove?.value?.id)">Remove</button>
        </form>
      </div>
    </div>
  </dialog>
</template>