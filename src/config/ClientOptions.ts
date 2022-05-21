import type { ClientOptions } from 'discord.js';

export const options: ClientOptions = {
	intents: 1711,
	allowedMentions: {
		parse: [],
		repliedUser: false,
		roles: [],
		users: []
	},
	failIfNotExists: false,
	partials: ['GUILD_MEMBER', 'MESSAGE', 'REACTION', 'USER'],
	presence: {
		activities: [
			{
				name: '/help',
				type: 'WATCHING'
			}
		],
		status: 'idle'
	},
	shards: 'auto'
};
