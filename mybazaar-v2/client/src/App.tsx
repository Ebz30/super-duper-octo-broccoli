import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ProtectedRoute from '@/components/protected-route';

// Pages
import Home from '@/pages/home';
import Login from '@/pages/login';
import Register from '@/pages/register';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 pt-16">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/login" component={Login} />
              <Route path="/register" component={Register} />
              
              {/* Protected routes - will be added in next session */}
              {/* <Route path="/sell">
                <ProtectedRoute>
                  <CreateListing />
                </ProtectedRoute>
              </Route> */}
            </Switch>
          </main>
          <Footer />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
