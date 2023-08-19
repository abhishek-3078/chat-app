const $messageFormAttach=document.querySelector('#attach')
const $messageFormRecordAudio=document.querySelector('#recordAudio')
const $stopAudio=document.querySelector('#stopRecordAudio')
 
//template
videoTemplate=document.querySelector('#video-template').innerHTML
audioTemplate=document.querySelector('#audio-template').innerHTML

const sendAttach=()=>{
    const attach=$messageFormAttach.files[0]
    console.log(attach.type)
    const reader=new FileReader()
    const {elem,id}=showToast("file is being sent...",1000000)
    // reader.readAsDataURL(attach)
    reader.readAsArrayBuffer(attach)
    reader.onload=()=>{
        // console.log(reader.result)
        
        const buffer=reader.result
        // const blob=new Blob([buffer],{type:attach.type})
        // const url=URL.createObjectURL(blob)
        const l=buffer.byteLength
        const offset=1024*16
        const vid=[]
        let begin=0;
        let i=0
        while(begin<l){
            
            vid.push(buffer.slice(begin,begin+offset))
            begin+=offset
            socket.emit("send-chunk",vid[i])
            i++;
        } 
        socket.emit("chunk-end",attach.type)
        $toastContainer.removeChild(elem)
        clearTimeout(id)
    }
}
let fileBuffer=[]
socket.on('postChunk',buffer=>{
    fileBuffer.push(buffer)
})
socket.on("completedUpload",(username,time,type)=>{
    console.log("completed")
    const blob=new Blob(fileBuffer,{type})
    const url=URL.createObjectURL(blob)
    type=type.split('/')
    if(type[0]==='video'){
    const html=Mustache.render(videoTemplate,{
        username,
        url,
        createdAt:moment(time).format("h:mm a")
        
    })
    $messages.insertAdjacentHTML("beforeend",html)
}else if(type[0]==="image"){
    const html=Mustache.render(imageTemplate,{
        username:username,
        url:url,
        createdAt:moment(time).format('h:mm a')
    })  
    $messages.insertAdjacentHTML("beforeend",html)
    $messages.lastElementChild.querySelector('img').onload=()=>{
        autoscroll()
    }
 
}else{
    const html=Mustache.render(messageTemplate,{
        username:username,
        message:`<a href=${url} target="_blank">Open File</a>`,
        createdAt:moment(time).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html) 
    autoscroll()
    // alert("Only Image and Video is supported")
}
    
    fileBuffer=[]
    autoscroll()
    
    
})

$messageFormRecordAudio.addEventListener('click',e=>{
    navigator.mediaDevices.getUserMedia({
        audio:true
    }).then(stream=>{
        $messageFormRecordAudio.style.display="none";
        $stopAudio.style.display="block";
        let chunks=[]
        const mediaRecorder=new MediaRecorder(stream)
        mediaRecorder.start();
        mediaRecorder.ondataavailable=(e)=>{
            chunks.push(e.data)
            console.log(chunks)
        }
        $stopAudio.onclick=(e)=>{
            mediaRecorder.stop()
            $stopAudio.style.display="none"
            $messageFormRecordAudio.style.display="block";
        }

        mediaRecorder.onstop=(e)=>{
            const blob=new Blob(chunks,{type:'audio/webm;codec=opus'})
            let offset=1024*16;
            
            let k=0
            let i=0
            while(k<blob.size){ 
                 
                socket.emit("send-audio-chunk",blob.slice(k,offset+k))
                k+=offset
            }
            socket.emit("audio-chunk-end",mediaRecorder.mimeType)
            
        }
    })
.catch(err=>{
        console.log(err)
    })
})
    let arr=[]
        socket.on("postAudioChunk",buffer=>{
            arr.push(buffer)
        })
        
        socket.on("completedAudioUpload",(username,time,type)=>{
            console.log(arr)
        
        const blob=new Blob(arr,{type})
        const url = URL.createObjectURL(blob)
        const html=Mustache.render(audioTemplate,{
            username:username,
            url:url,
            createdAt:moment(time).format('h:mm a')
        })  
        $messages.insertAdjacentHTML("beforeend",html)
        autoscroll()
        arr=[]
        })


