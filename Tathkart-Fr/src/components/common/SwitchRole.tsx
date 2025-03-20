
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, ChefHat, Briefcase, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const SwitchRole: React.FC = () => {
  return (
    <div className="container h-full flex flex-col items-center justify-center py-8 px-4">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-lg"
      >
        <motion.div variants={item}>
          <CardTitle className="text-center text-2xl font-bold mb-8">
            Select Your Role
          </CardTitle>
        </motion.div>
        
        <motion.div variants={item}>
          <Link to="/login/user" className="block mb-4">
            <Card className="hover:shadow-md transition-all duration-300 hover:border-tathkart-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center pb-2">
                <ChefHat className="h-6 w-6 mr-4 text-tathkart-500" />
                <CardTitle className="text-lg">Restaurant / Hotel User</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Log in to place daily grocery orders for your restaurant
              </CardContent>
              <CardFooter className="pt-1 text-xs text-muted-foreground">
                Hotel ID and phone number required
              </CardFooter>
            </Card>
          </Link>
        </motion.div>
        
        <motion.div variants={item}>
          <Link to="/login/admin" className="block mb-4">
            <Card className="hover:shadow-md transition-all duration-300 hover:border-tathkart-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center pb-2">
                <Briefcase className="h-6 w-6 mr-4 text-tathkart-700" />
                <CardTitle className="text-lg">Admin</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Manage user registrations, process orders, and oversee operations
              </CardContent>
              <CardFooter className="pt-1 text-xs text-muted-foreground">
                Admin credentials required
              </CardFooter>
            </Card>
          </Link>
        </motion.div>
        
        <motion.div variants={item}>
          <Link to="/login/delivery" className="block mb-4">
            <Card className="hover:shadow-md transition-all duration-300 hover:border-tathkart-300 cursor-pointer">
              <CardHeader className="flex flex-row items-center pb-2">
                <Truck className="h-6 w-6 mr-4 text-tathkart-600" />
                <CardTitle className="text-lg">Delivery Personnel</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                View assigned deliveries and manage your delivery tasks
              </CardContent>
              <CardFooter className="pt-1 text-xs text-muted-foreground">
                Delivery staff credentials required
              </CardFooter>
            </Card>
          </Link>
        </motion.div>
        
        <motion.div variants={item} className="mt-8 text-center">
          <Link to="/">
            <Button variant="outline" size="sm" className="text-sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SwitchRole;
