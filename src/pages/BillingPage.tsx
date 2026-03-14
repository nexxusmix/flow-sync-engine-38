import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillingOverview } from '@/components/billing/BillingOverview';
import { BillingPlans } from '@/components/billing/BillingPlans';
import { BillingAddons } from '@/components/billing/BillingAddons';
import { BillingSubscriptions } from '@/components/billing/BillingSubscriptions';
import { BillingInvoices } from '@/components/billing/BillingInvoices';
import { BillingUsage } from '@/components/billing/BillingUsage';
import { BillingRevenue } from '@/components/billing/BillingRevenue';

export default function BillingPage() {
  const [tab, setTab] = useState('overview');

  return (
    <DashboardLayout title="Billing & Monetização">
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="material-symbols-rounded text-primary">payments</span>
            Billing, Planos & Monetização
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie planos, assinaturas, consumo e receita da plataforma.
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/30 border border-border/40 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="gap-1.5 text-xs">
              <span className="material-symbols-rounded text-[14px]">dashboard</span> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-1.5 text-xs">
              <span className="material-symbols-rounded text-[14px]">list_alt</span> Planos
            </TabsTrigger>
            <TabsTrigger value="addons" className="gap-1.5 text-xs">
              <span className="material-symbols-rounded text-[14px]">extension</span> Addons
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1.5 text-xs">
              <span className="material-symbols-rounded text-[14px]">card_membership</span> Assinaturas
            </TabsTrigger>
            <TabsTrigger value="usage" className="gap-1.5 text-xs">
              <span className="material-symbols-rounded text-[14px]">speed</span> Consumo
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5 text-xs">
              <span className="material-symbols-rounded text-[14px]">receipt_long</span> Faturas
            </TabsTrigger>
            <TabsTrigger value="revenue" className="gap-1.5 text-xs">
              <span className="material-symbols-rounded text-[14px]">trending_up</span> Receita
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4"><BillingOverview /></TabsContent>
          <TabsContent value="plans" className="mt-4"><BillingPlans /></TabsContent>
          <TabsContent value="addons" className="mt-4"><BillingAddons /></TabsContent>
          <TabsContent value="subscriptions" className="mt-4"><BillingSubscriptions /></TabsContent>
          <TabsContent value="usage" className="mt-4"><BillingUsage /></TabsContent>
          <TabsContent value="invoices" className="mt-4"><BillingInvoices /></TabsContent>
          <TabsContent value="revenue" className="mt-4"><BillingRevenue /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
