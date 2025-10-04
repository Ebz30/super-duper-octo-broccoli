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
import Browse from '@/pages/browse';
import CreateListing from '@/pages/create-listing';
import ItemDetail from '@/pages/item-detail';
import Favorites from '@/pages/favorites';
import MyListings from '@/pages/my-listings';
import Profile from '@/pages/profile';
import EditListing from '@/pages/edit-listing';

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
              <Route path="/browse" component={Browse} />
              <Route path="/items/:id" component={ItemDetail} />
              
              {/* Protected routes */}
              <Route path="/sell">
                <ProtectedRoute>
                  <CreateListing />
                </ProtectedRoute>
              </Route>
              <Route path="/favorites">
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              </Route>
              <Route path="/my-listings">
                <ProtectedRoute>
                  <MyListings />
                </ProtectedRoute>
              </Route>
              <Route path="/profile">
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </Route>
              <Route path="/items/:id/edit">
                <ProtectedRoute>
                  <EditListing />
                </ProtectedRoute>
              </Route>
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
