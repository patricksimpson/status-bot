require('dotenv').config()

const RtmClient = require('@slack/client').RtmClient;
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const WebClient = require('@slack/client').WebClient;

const bot_token = process.env.SLACK_BOT_TOKEN || '';
const web_token = process.env.SLACK_WEB_TOKEN || '';
const rtm = new RtmClient(bot_token);
const web = new WebClient(web_token);

console.log('Starting bot, please stand by.');

let channel;
let users = [];

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  for (const c of rtmStartData.channels) {
	  if (c.is_member && c.name ==='status') { channel = c.id }
  }
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
});

rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
  console.log('connected');
});

rtm.on(RTM_EVENTS.USER_CHANGE, function(e){
  const user = e.user;
  const id = user.id;
  const name = user.name;
  const message = `${name} updated`;
  web._makeAPICall('users.profile.get', null, {user: id}, function(err, info) {
    if (!err) {

      const profile = info.profile;
      const userStatus = `${profile.status_emoji} ${profile.status_text}`;

      let index = users.findIndex( u => u.id === id);

      if (index < 0) {
        index = users.length;
        users.push( {id, name, status: '' } );
      }

      let savedUser = users[index];

      if (savedUser.status !== userStatus) {
        users[index].status = userStatus;
        if (userStatus.trim() !== '') {
          rtm.sendMessage(`${name}: ${userStatus}`, channel);
        } else {
          rtm.sendMessage(`${name} removed status.`, channel);
        }
      }
    } else {
      console.log('There was an error: ', err);
    }
  });
});

rtm.start();
