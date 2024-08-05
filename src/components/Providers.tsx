'use client'

import React, { ReactNode, useState } from 'react'
import {QueryClient, QueryClientProvider} from "@tanstack/react-query"
import { trpc } from '@/app/_trpc/client'
import { httpBatchLink } from '@trpc/client'

function Providers({children}: {children:ReactNode} ) {

    const [queryClient] = useState(() => new QueryClient())
    const [trpcClient] = useState(() => 
        trpc.createClient({
        links: [
            httpBatchLink({
                url : 'http://localhost:3000/api/trpc'
            })
        ]
    }))



  return (
    <QueryClientProvider client = {queryClient}>
    <trpc.Provider 
    client = {trpcClient} 
    queryClient= {queryClient}>
        {children}
    </trpc.Provider>
    </QueryClientProvider>
  )
}

export default Providers