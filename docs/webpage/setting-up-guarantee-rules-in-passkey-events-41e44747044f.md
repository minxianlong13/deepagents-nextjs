<!-- source-url: https://support.cvent.com/s/communityarticle/Passkey-Guarantee-Rules -->

# Setting Up Guarantee Rules in Passkey Events

If you are organizing a Passkey event with multiple participating hotels, you can define rules to assign [guarantee types](https://support.cvent.com/s/communityarticle/Configuring-Guarantee-Types-in-Passkey-Events) based on the hotel an attendee selects, rather than relying only on the attendee type. This gives you more flexibility to align guarantee requirements with each hotel's policies and contractual agreements, providing more granular control and reducing manual work. Reference the sections below to learn how to [add](#Add), [edit](#Edit), or [delete](#Delete) guarantee rules in a Passkey event.

Adding Guarantee Rules

**1 Define guarantee types for your event.** Before you can configure guarantee rules, you must first [add the guarantee types](https://support.cvent.com/s/communityarticle/Configuring-Guarantee-Types-in-Passkey-Events) that can be used in your event.

Once you've added the guarantee types, select which one should be [marked as the default](https://support.cvent.com/s/communityarticle/Configuring-Guarantee-Types-in-Passkey-Events#PK_event_Default_Guarantee).

**2 Activate guarantee rules.** By default, guarantee types are assigned based on attendee types. If you need to assign guarantee types based on the hotel an attendee selects, begin by selecting your Passkey event. From the Event navigation, under Event Home, click **Guarantee Types**.

In the Guarantee Rules section, select **Hotels**, then click **Apply change**. 

The switch from Attendee Types to Hotels will not affect existing reservations, but it will trigger a series of visual changes in your event setup, such as:

-   A new option called "Guarantee Rules" will appear in the Event navigation, under Event Home. 
-   The "Assigned to" column in the Current Guarantee Types section will no longer show up under _Event Home > Guarantee Types_.
-   The "Assigned Payment Plan" column will no longer show up under _Event Home > Attendee Types_.
-   The option to associate a guarantee type to an attendee type will no longer show up when you [create an attendee type](https://support.cvent.com/s/communityarticle/Managing-Attendee-Types-in-a-Passkey-Event#PK_event_att_create) under _Event Home > Event Inventory > Inventory Tasks > Add Attendee Types_ _> New Attendee._
-   The option to associate a guarantee type to an attendee type will no longer show up when you set up [sub-block requests](https://support.cvent.com/s/communityarticle/Creating-Public-Block-Requests-in-Citywide-Events#Automatic) with automatic inventory allocation.

These changes ensure that guarantee types are applied based solely on the guarantee rules you define, and not on attendee types.

**3 Review and update the default guarantee rule, if necessary.** From the Event navigation, under Event Home, click **Guarantee Rules**.

You'll see a default rule already added. This rule is initially configured to assign the [default guarantee type](https://support.cvent.com/s/communityarticle/Configuring-Guarantee-Types-in-Passkey-Events#PK_event_Default_Guarantee) to future reservations made by any attendee type for any hotel added to your event. Once you define additional guarantee rules, the default rule will act as a fallback, and will only apply to future reservations or reservation modifications that do not meet any of the other guarantee rules you add.

While you cannot remove the default rule, you can change its name and associated guarantee type by clicking **Edit** to the right. Once you've made the desired changes, click **Save**.

**NOTE:** Changing the guarantee type assigned to the default rule does not affect existing reservations, but may affect reservations that are subsequently created or modified.

**4 Add guarantee rules.** To create a hotel-based rule, begin by clicking **Add rule** in the top-right.

Name your rule. Don't worry, the rule name won't be displayed to attendees.

Select the desired guarantee type, then select one or more event hotels for this rule.

When you're finished, click **Save**. 

You can add as many guarantee rules as you need, but keep in mind you cannot associate a hotel to multiple rules.

The rules you add will be listed below the default rule and will be sorted by the modified date, with the most recently modified rule at the top of the list. If necessary, you can sort the rules in alphabetical order.

[Reference this article](https://support.cvent.com/s/communityarticle/How-do-Passkey-guarantee-rules-work-in-an-event) to learn how guarantee rules work once you define them.

Editing Guarantee Rules

Follow the steps below to make changes to guarantee rules in a Passkey event.

**NOTE:** Changing the guarantee type, associated hotels, or both in a guarantee rule does not affect existing reservations, but may affect reservations that are subsequently created or modified.

**1 Access your guarantee rules.** Begin by selecting your Passkey event. From the Event navigation, under Event Home, click **Guarantee Rules**.

**2 Edit a guarantee rule.** Locate the rule you want to modify, then click the **Rule Actions** icon to the right. Click **Edit**.

You can change the rule name, select a different guarantee type, and add or remove hotels assigned to the rule. To remove a hotel associated with the rule, click the **Remove** icon next to the hotel name. You'll need to have at least one hotel assigned to a rule.

When you're finished, click **Save**.

Deleting Guarantee Rules

**1 Access your guarantee rules.** Begin by selecting your Passkey event. From the Event navigation, under Event Home, click **Guarantee Rules**.

**2 Delete a guarantee rule.** Locate the rule you want to remove, then click the **Rule Actions** icon to the right. Click **Delete**, then **Delete rule** to confirm. 

When a reservation is subsequently created for a hotel that was associated with the deleted rule, Passkey will apply the default guarantee rule as long as no other guarantee rule was created for the hotel.
