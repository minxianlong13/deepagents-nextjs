# Setting Up the Passkey Integration in Registration

Integrating your events with Passkey can help you streamline the process of collecting travel information for your attendees. They can book their accommodations without having to provide their personal details again, while you will be able to report on both registrations and hotel reservations for your event.

Follow the steps below to [enable your event for Passkey integration](#Enable) and [connect it to a corresponding Passkey event](#Connect).

Enabling the Two-Way Passkey Integration in Your Event

**1 Add the Travel feature to your event.** Begin by selecting your event or [creating a new one](https://support.cvent.com/s/communityarticle/Creating-an-Event).

From the Event navigation, hover over **Details**, then click **Event Features**.

Click **Add** next to Travel.

**2 Enable the two-way Passkey integration.** From the Event navigation, hover over **Travel**, then click **Travel Settings**.

Click the ![Edit](https://support.cvent.com/servlet/rtaImage?eid=ka0Ui000000LNhZ&feoid=00N2G00000CxUw1&refid=0EM2G000003URp4) icon next to Hotel, then select **Yes** under "Do your registrants need hotel accommodations?" Select **Two-way Passkey integration**, then click the ![Save](https://support.cvent.com/servlet/rtaImage?eid=ka0Ui000000LNhZ&feoid=00N2G00000CxUw1&refid=0EM2G000002ODAV) icon in the upper right to save your settings.

Click **Change Settings** to confirm.

Connecting Your Registration and Passkey Events

**1 Ensure the Passkey event is RegLink-enabled.** Begin by selecting your Passkey event. Or, if the event was created by a Passkey licensee such as the contracted hotel or a third-party organization, ask them to access it for you. Ensure that "Cvent Events" is [added and enabled as a registration provider](https://support.cvent.com/s/communityarticle/Why-isn-t-Passkey-syncing-with-my-Cvent-event) under _Details > API Access._

**2 Obtain the Passkey Open Event URL.** If you don't have access to the Passkey event, contact the licensed organization or hotel that created it and ask them to provide you with the Open Event URL found under _Website > Event Website > View All URLs_.

If you have access to the Passkey event, you can obtain the URL yourself. [Access the URLs page](https://support.cvent.com/s/communityarticle/Where-can-I-view-the-Passkey-booking-website-URLs) and copy the link to the right of Open Event.

**3 Connect to the Passkey event.** Back in Cvent, select your event. From the Event navigation, hover over **Travel**, then click **Hotel Accommodations**. Click **Edit**.

In the Passkey Setup tab, enter the Passkey Open Event URL.

Choose whether you want to assign Passkey room blocks based on [registration paths](https://support.cvent.com/s/communityarticle/Adding-Registration-Paths-to-Your-Event) or [admission items](https://support.cvent.com/s/communityarticle/Creating-Admission-Items).

If you need to restrict room block bookings to specific attendees, you can enable access codes to automatically assign the correct Passkey attendee type once the attendees complete their registration.

Before you enable this option, make sure you have [access codes enabled](https://support.cvent.com/s/communityarticle/Enabling-Access-Codes-for-Attendee-Types-in-Passkey#PK_Event_AdvOp_Att_Code) for the desired attendee types in the Passkey event, and [add an internal question to your event or account](https://support.cvent.com/s/communityarticle/Creating-Internal-Information-Questions) to store access code information. Then [add the access code to the internal information question](https://support.cvent.com/s/communityarticle/Creating-Internal-Information-Questions#record) for the desired attendees before they register.

The toggle will be disabled if there are no Internal Information questions at the event or account level. Access code mapping works alongside the existing Registration Path/Admission Item mapping and will override it when the internal question has a value.

Select **Yes** below "Enable Access Code," then, from the Internal information question dropdown, select the question that stores Passkey access code information.

Click **Save**, then **Connect**. If the connection is successful, the message "Your Passkey event is now connected to your Cvent event" will be displayed, and the **Connect** button will be replaced with a **Re-Sync** button. If you make any subsequent changes to the attendee types, room types, or hotels participating in the Passkey event, make sure you use this button to synchronize the updated details in your Cvent event.

**NOTE:** Once the connection is established, you can no longer change the Passkey Event URL.

**4 Map your Passkey attendee types.** Click **Attendee Mapping**, then **Edit**. Depending on what you selected in the Passkey Setup tab, you will be prompted to map the Passkey attendee types to the appropriate [registration paths](https://support.cvent.com/s/communityarticle/Adding-Registration-Paths-to-Your-Event) or [admission items](https://support.cvent.com/s/communityarticle/Creating-Admission-Items).

Use the dropdowns under Passkey Attendee Type to set up the desired mapping. Leave registration paths or admission items that don't need to be mapped blank.

If you enabled access codes in the Passkey Setup tab, the access code mapping will override the registration path or admission item mapping. This means that attendees who have an access code stored in the internal information question will be mapped to the Passkey attendee type associated with the access code.

**5 Verify that your events have been successfully linked.** Click the **Hotels** tab. If your Registration and Passkey events have been successfully linked, the hotels added in the Passkey event will display here.

Click the name of a hotel to check that its details such as name and address show up. Click **Close**.

**6 Add the Passkey Hotel Request widget.** To ensure your registrants can proceed to book their rooms right after they have registered for your event, you need to add the Passkey Hotel Request widget to the desired Post-Registration page. We recommend adding it to the Confirmation page so attendees can use it as soon as they have successfully registered.

From the Event navigation, hover over **Registration**, then click **Registration Process**. Click **Open Site Designer**.

Click the Registration Page dropdown in the top-left. If you have several registration paths, select one from the Registration Paths dropdown, then, under Post Registration Pages, select the page where you want to add the widget.

Next, drag and drop the Passkey Hotel Request widget to the desired position on the canvas. To ensure registrants easily spot the hotel request option, we recommend placing the widget towards the top of the page.

**NOTE:** Registrants _must_ initiate the hotel booking from the page where the Passkey Hotel Request widget was added. Otherwise, their registration and reservation records will not be linked.

Use the configuration options to the right of the canvas to customize the widget. For example, you can change the text of the Select Hotel button, the header name, or the instructional text.

You can edit the widget further by clicking **Customize** and using the available styling options.

Remember to add the Passkey Hotel Request widget on the desired Post-Registration page for each registration path that needs access to the Passkey booking site.

[Make any other edits](https://support.cvent.com/s/communityarticle/Using-the-Site-Designer) you need to your registration site, then click **Save** to preserve the draft, or click **Publish** to make it visible to invitees.

**NOTE:** If registration has already launched, send existing registrants an email to modify their registration using the {\[E-MODIFY REG LINK\]} or {\[E-MODIFY REG URL\]}. They must proceed through to the Confirmation page and click the Passkey widget, this is the only way a bridge ID can be created.

**7 Report on Passkey bookings in your event.** Once your event is launched and registrations are open, you can keep track of Passkey bookings by running reports.

From the Event navigation, hover over **Reports**, then click **Reports**. Select the **Report Templates** tab if necessary, then scroll down to the Travel section. Here you can find a list of [reports you can run](https://support.cvent.com/s/communityarticle/Your-Guide-to-Running-Reports-in-Cvent#Run), such as the Hotel Request Details that pulls Passkey reservation data.

**NOTE:** For Passkey-integrated events, once you have run the rooming list and confirmed that all hotel confirmation numbers have been received, export those confirmation numbers into the [Internal Information](https://support.cvent.com/s/communityarticle/Creating-Internal-Information-Questions) field in Cvent Registration. This helps prevent attendees from receiving duplicate hotel confirmation emails.
