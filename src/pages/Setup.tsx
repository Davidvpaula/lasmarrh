import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Shield } from "lucide-react"

const Setup = () => {
  const [loading, setLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const { toast } = useToast()

  const createFirstAdmin = async () => {
    setLoading(true)
    try {
      // Create the admin user with the specified credentials
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'comercial@telemedlasmar.com',
        password: 'Ribeiro9692@',
        options: {
          data: {
            full_name: 'Administrador Comercial',
            role: 'admin'
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Update the profile to admin role
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('user_id', authData.user.id)

        if (profileError) throw profileError
      }

      setIsComplete(true)
      toast({
        title: "Administrador criado com sucesso!",
        description: "Use as credenciais: comercial@telemedlasmar.com / Ribeiro9692@",
      })
    } catch (error: any) {
      console.error('Error creating admin:', error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o administrador.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Setup Completo!</CardTitle>
            <CardDescription>
              Administrador criado com sucesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Agora você pode fazer login com:
              </p>
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">Email: comercial@telemedlasmar.com</p>
                <p className="font-medium">Senha: Ribeiro9692@</p>
              </div>
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="w-full"
              >
                Ir para Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Setup Inicial</CardTitle>
          <CardDescription>
            Criar primeira conta de administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Credenciais do Administrador:</p>
              <p className="text-sm text-muted-foreground">Email: comercial@telemedlasmar.com</p>
              <p className="text-sm text-muted-foreground">Senha: Ribeiro9692@</p>
            </div>
            
            <Button 
              onClick={createFirstAdmin}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Criando..." : "Criar Administrador"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Setup