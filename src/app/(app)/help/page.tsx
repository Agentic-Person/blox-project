import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HelpCircle, MessageCircle, Book, Mail } from 'lucide-react'

export default function HelpPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-blox-white mb-8">Help & Support</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Book className="mr-2 h-5 w-5 text-blox-teal" />
              Documentation
            </CardTitle>
            <CardDescription>
              Browse our comprehensive guides
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">View Documentation</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5 text-blox-teal" />
              Discord Support
            </CardTitle>
            <CardDescription>
              Get help from our community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Join Discord</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5 text-blox-teal" />
              Contact Us
            </CardTitle>
            <CardDescription>
              Send us a message directly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Send Message</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="mr-2 h-5 w-5 text-blox-teal" />
              FAQ
            </CardTitle>
            <CardDescription>
              Frequently asked questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">View FAQ</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}