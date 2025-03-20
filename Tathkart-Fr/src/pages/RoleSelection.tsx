import React from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '@/components/layout/PageTransition';
import BrandLogo from '@/components/ui/brand-logo';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Store, Users, Truck, ArrowRight } from 'lucide-react';

const RoleSelection = () => {
  const roles = [
    {
      id: 'user',
      title: 'Hotel / Restaurant',
      description: 'Place orders for daily groceries and manage your inventory',
      icon: <Store className="h-8 w-8 text-tathkart-gold" />,
      color: 'bg-gradient-to-br from-tathkart-800 to-tathkart-700',
      features: ['Order groceries', 'Track deliveries', 'Manage inventory']
    },
    {
      id: 'admin',
      title: 'Admin Dashboard',
      description: 'Complete control over users, orders, and system management',
      icon: <Users className="h-8 w-8 text-tathkart-gold" />,
      color: 'bg-gradient-to-br from-tathkart-800 to-tathkart-700',
      features: ['User management', 'Order processing', 'Analytics']
    },
    {
      id: 'delivery',
      title: 'Delivery Partner',
      description: 'Efficiently manage and complete delivery assignments',
      icon: <Truck className="h-8 w-8 text-tathkart-gold" />,
      color: 'bg-gradient-to-br from-tathkart-800 to-tathkart-700',
      features: ['View orders', 'Real-time updates', 'Delivery tracking']
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-tathkart-900 to-tathkart-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <BrandLogo size="lg" className="mx-auto" />
            <h1 className="text-4xl font-bold mt-8 text-white">
              Welcome to Tathkart
            </h1>
            <p className="text-tathkart-100 mt-4 text-lg max-w-xl mx-auto">
              Select your role to access the perfect dashboard for your needs
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link to={`/login/${role.id}`}>
                  <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:shadow-tathkart-gold/20 border-none overflow-hidden backdrop-blur-sm bg-white/5">
                    <CardContent className={`p-6 ${role.color}`}>
                      <div className="bg-tathkart-700/30 rounded-full p-3 inline-block mb-4">
                        {role.icon}
                      </div>
                      <h3 className="font-bold text-2xl text-white mb-2">
                        {role.title}
                      </h3>
                      <p className="text-tathkart-100 text-sm mb-6">
                        {role.description}
                      </p>
                      <ul className="space-y-2 mb-6">
                        {role.features.map((feature, i) => (
                          <li key={i} className="flex items-center text-sm text-tathkart-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-tathkart-gold mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center text-tathkart-gold hover:text-tathkart-gold/80 transition-colors">
                        <span className="text-sm font-medium">Continue</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default RoleSelection;
