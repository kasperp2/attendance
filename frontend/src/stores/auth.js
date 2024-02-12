import { ref } from 'vue'
import { defineStore } from 'pinia'

function setCookie(name,value,days) {
  var expires = "";
  if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

function eraseCookie(name) {   
  document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}


export const useAuthStore = defineStore('auth', async () => {
  const ip = 'http://192.168.0.117:3000'
  const user = ref(null)



  const tokenLogin = async () => {
    const response = await fetch(`${ip}/token-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: getCookie('token')})
    }).then(res => res.json())

    setCookie('token', response.token)
    user.value = response.user
  }

  const login = async () => {
      const response = await fetch(`${ip}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: 'admin', password: 'admin' })
      }).then(res => res.json())

      setCookie('token', response.token)
      user.value = response.user
  }

  return { user, login }
})
