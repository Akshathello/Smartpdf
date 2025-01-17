'use client'


import React from 'react'
import Messages from '@/components/chat/Messages'
import ChatInput from './ChatInput'
import { trpc } from '@/app/_trpc/client'
import { Loader2, XCircle } from 'lucide-react'
import { ChatContextProvider } from './ChatContext'

interface ChatWrapperProps{
  fileId: string
} 

function ChatWrapper({fileId}: ChatWrapperProps) {

  console.log("fileId",fileId)

  const {data, isLoading} = 
  trpc.getFileUploadedStatus.useQuery({

    fileId
  }, {  
    refetchInterval : (data) => 
      data?.status === "SUCCESS" ||
     data?.status === "FAILED" 
     ?false 
     : 500,
    
  }
)  

  if(isLoading) 
    return (
    <div className = "relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2" >
      <div className = "flex-1 flex justify-center items-center mb-28">
         <div className = "flex flex-col items-center gap-2">
          <Loader2 className = "h-8 w-8 text-blue-500 animate-spin" />
          <h3 className = 'font-semibold text-xl'>
            Loading...
          </h3>
          <p className = 'text-zinc-500 text-sm'>
            We&pos;re preparing your PDF.
          </p>
         </div>
      </div>

      <ChatInput isDisabled/>
    </div>
  )

   if(data?.status === 'PROCESSSING') return(

    <div className = "relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2" >
      <div className = "flex-1 flex justify-center items-center mb-28">
         <div className = "flex flex-col items-center gap-2">
          <Loader2 className = "h-8 w-8 text-blue-500 animate-spin" />
          <h3 className = 'font-semibold text-xl'>
            Processing PDF...
          </h3>
          <p className = 'text-zinc-500 text-sm'>
            This won&apos;t take long.
          </p>
         </div>
      </div>

      <ChatInput isDisabled/>
    </div>

   )

   if(data?.status === 'FAILED') return (
    <div className = "relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2" >
      <div className = "flex-1 flex justify-center items-center mb-28">
         <div className = "flex flex-col items-center gap-2">
          <XCircle className = "h-8 w-8 text-red-500 " />
          <h3 className = 'font-semibold text-xl'>
            Too many pages in PDF
          </h3>
          <p className = 'text-zinc-500 text-sm'>
            Your <span className = "font-medium">Free </span> plan supports upto 5 pages per PDF
          </p>
         </div>
      </div>

      <ChatInput isDisabled/>
    </div>
   )
 

  return (
    <ChatContextProvider fileId={fileId}>
    <div className = "relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">

      <div className = "flex-1 justify-between flex flex-col mb-28">

        <Messages fileId= {fileId} />

      </div>

      <ChatInput/>

    </div>
    </ChatContextProvider>
  
   )
}

export default ChatWrapper