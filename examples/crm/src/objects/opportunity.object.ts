import { ObjectSchema, Field } from '@objectstack/spec/data';

export const OpportunityObject = ObjectSchema.create({
  name: 'opportunity',
  label: 'Opportunity',
  icon: 'trending-up',
  fields: {
    name: Field.text({ label: 'Opportunity Name', required: true, searchable: true }),
    amount: Field.currency({ label: 'Amount' }),
    stage: Field.select(["Prospecting", "Proposal", "Negotiation", "Closed Won", "Closed Lost"], { label: 'Stage' }),
    close_date: Field.date({ label: 'Close Date' }),
    account: Field.lookup('account', { label: 'Account' }),
    contacts: Field.lookup('contact', { label: 'Contacts', multiple: true }),
    probability: Field.percent({ label: 'Probability' }),
    type: Field.select(['New Business', 'Existing Business', 'Upgrade', 'Renewal'], { label: 'Type' }),
    lead_source: Field.select(['Web', 'Phone', 'Partner', 'Referral', 'Other'], { label: 'Lead Source' }),
    next_step: Field.text({ label: 'Next Step' }),
    description: Field.textarea({ label: 'Description' })
  },
  list_views: {
    all: {
      label: 'All Opportunities',
      columns: ['name', 'account', 'amount', 'stage', 'probability', 'close_date', 'type']
    },
    closing_soon: {
      label: 'Closing Soon',
      columns: ['name', 'amount', 'stage', 'close_date', 'next_step'],
      sort: [['close_date', 'asc']]
    },
    won: {
      label: 'Won',
      columns: ['name', 'amount', 'account', 'close_date'],
      filter: [['stage', '=', 'Closed Won']]
    },
    pipeline: {
      label: 'Pipeline',
      type: 'kanban',
      columns: ['name', 'amount', 'account'],
      groupField: 'stage',
      titleField: 'name',
      cardFields: ['amount', 'account', 'close_date', 'probability']
    } as any
  }
});
