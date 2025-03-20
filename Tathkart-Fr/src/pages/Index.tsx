
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/ui/brand-logo';
import PageTransition from '@/components/layout/PageTransition';
import { ShoppingBag, ChefHat, Truck } from 'lucide-react';

const Index = () => {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        {/* Hero section */}
        <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-tathkart-50 to-background z-0"></div>
          
          {/* Animated circles in background */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-tathkart-100" 
              animate={{ 
                y: [0, 20, 0], 
                x: [0, 10, 0],
                scale: [1, 1.05, 1] 
              }}
              transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.div 
              className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-tathkart-50" 
              animate={{ 
                y: [0, -30, 0], 
                x: [0, -15, 0],
                scale: [1, 1.03, 1] 
              }}
              transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
            />
          </div>
          
          <div className="container mx-auto px-4 z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <BrandLogo size="lg" className="mx-auto" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl font-bold text-tathkart-950 mb-6"
            >
              Simplify Your <span className="text-tathkart-600">Daily Groceries</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg text-muted-foreground max-w-xl mx-auto mb-10"
            >
              Streamlined grocery deliveries for hotels and restaurants. Easy ordering, efficient processing, and reliable delivery.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <Link to="/role">
                <Button size="lg" className="rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  Get Started
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                    className="ml-2"
                  >
                    →
                  </motion.div>
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
        
        {/* Features section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-tathkart-950 mb-4">Three Simple Dashboards</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our platform connects users, administrators, and delivery personnel through specialized interfaces.
                </p>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "User Dashboard",
                  description: "Place and track your daily grocery orders with ease",
                  icon: <ChefHat className="h-8 w-8 text-tathkart-500" />,
                  delay: 0
                },
                {
                  title: "Admin Dashboard",
                  description: "Manage registrations, process orders, and oversee operations",
                  icon: <ShoppingBag className="h-8 w-8 text-tathkart-600" />,
                  delay: 0.2
                },
                {
                  title: "Delivery Dashboard",
                  description: "View and complete assigned orders efficiently",
                  icon: <Truck className="h-8 w-8 text-tathkart-700" />,
                  delay: 0.4
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: feature.delay }}
                  viewport={{ once: true }}
                  className="glass-card p-6"
                >
                  <div className="bg-tathkart-50 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-center mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground text-center">{feature.description}</p>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              className="mt-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Link to="/role">
                <Button size="lg" variant="outline" className="rounded-full px-8">
                  Choose Your Dashboard
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="bg-tathkart-950 text-white py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <BrandLogo className="text-white" />
              </div>
              <div className="text-tathkart-200 text-sm">
                &copy; {new Date().getFullYear()} Tathkart. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default Index;
