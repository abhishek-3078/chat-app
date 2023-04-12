const socket=io()
//event name must be same as emitted
const $messageForm=document.querySelector('#message-form')
const $messageFormInput=$messageForm.querySelector('input')
const $messageFormButton=$messageForm.querySelector
('button')

const $locationButton=document.querySelector
('#send-location')
const $messages=document.querySelector('#messages')

//templates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationMessageTemplate=document.querySelector('#location-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML
const imageTemplate=document.querySelector('#image-template').innerHTML

//options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll=()=>{
    //new message element
    const $newMessage=$messages.lastElementChild
    console.log($newMessage,$newMessage.offsetHeight)
    //height of the new message
    const newMessageStyles=getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=$newMessage.offsetHeight+newMessageMargin
    console.log(newMessageHeight) 

    //visibleHeight 
    const visibleHeight=$messages.offsetHeight

    //height of messages container
    const containerHeight=$messages.scrollHeight

    //how far have i scrolled?
    const scrollOffset=$messages.scrollTop + visibleHeight

    if(containerHeight-newMessageHeight<=scrollOffset){
        $messages.scrollTop=$messages.scrollHeight

    }
    

}
socket.on('message',(message)=>{
    console.log(message)
    const html=Mustache.render(messageTemplate,{
        username:message.username,
        message:message.text,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html) 
    autoscroll()
})

socket.on('locationMessage',(message)=>{
    console.log(message)
    const html=Mustache.render(locationMessageTemplate,{
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML=html
})
document.querySelector('#message-form').addEventListener('submit',(e)=>{
    e.preventDefault() 
    //disable the form
    $messageFormButton.setAttribute('disabled','disabled')
    
    const message=e.target.elements.message.value 
    //acknowledgement is client getting notified by server thst the event was received and processed
    socket.emit('sendMessage',message,(error)=>{
        //enable the form
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value=''
        $messageFormInput.focus() 
        if(error){
            return console.log(error)
        }
        console.log('message delivered')
    }) 
 
})

$locationButton.addEventListener('click',()=>{
    $locationButton.setAttribute('disabled','disabled')
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude}, ()=>{
    $locationButton.removeAttribute('disabled')
        console.log("Location shared")
    })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})