import { HashSet } from 'prelude-ts';
import { LispExpression } from './lisp';
import { Field, FieldVariant, Struct, WeakEnum } from './variable';

const schema: Record<string, {
    fields: Record<string, ReadonlyArray<WeakEnum>>
    uniqueness: ReadonlyArray<ReadonlyArray<string>>
    checks: Record<string, LispExpression>
}> =
{
    User: {
        fields: {
            mobile: [{ type: 'str' }],
            first_name: [{ type: 'str' }],
            last_name: [{ type: 'str' }]
        },
        uniqueness: [['mobile']],
        checks: {}
    },
    Wallet: {
        fields: {
            owner: [
                { type: 'other', other: 'User' },
                { type: 'other', other: 'Alliance' },
                { type: 'other', other: 'Guild' },
                { type: 'other', other: 'Clan' }
            ],
            copper: [{ type: 'udecimal' }],
            silver: [{ type: 'udecimal' }],
            gold: [{ type: 'udecimal' }],
        },
        uniqueness: [],
        checks: {}
    },
    Alliance: {
        fields: {
            name: [{ type: 'str' }],
            leader: [{ type: 'other', other: 'User' }]
        },
        uniqueness: [['name']],
        checks: {}
    },
    Guild: {
        fields: {
            name: [{ type: 'str' }],
            leader: [{ type: 'other', other: 'User' }]
        },
        uniqueness: [['name']],
        checks: {}
    },
    Clan: {
        fields: {
            name: [{ type: 'str' }],
            leader: [{ type: 'other', other: 'User' }]
        },
        uniqueness: [['name']],
        checks: {}
    },
    AllianceMember: {
        fields: {
            alliance: [{ type: 'other', other: 'Alliance' }],
            member: [{ type: 'other', other: 'User' }]
        },
        uniqueness: [['alliance', 'member']],
        checks: {}
    },
    GuildMember: {
        fields: {
            guild: [{ type: 'other', other: 'Guild' }],
            member: [{ type: 'other', other: 'User' }]
        },
        uniqueness: [['guild', 'member']],
        checks: {}
    },
    ClanMember: {
        fields: {
            clan: [{ type: 'other', other: 'Clan' }],
            member: [{ type: 'other', other: 'User' }]
        },
        uniqueness: [['clan', 'member']],
        checks: {}
    },
    UnlistedProduct: {
        fields: {
            user: [{ type: 'other', other: 'User' }],
            name: [{ type: 'str' }]
        },
        uniqueness: [['user', 'name']],
        checks: {}
    },
    ListedProduct: {
        fields: {
            alliance: [{ type: 'other', other: 'Alliance' }],
            product: [{ type: 'other', other: 'UnlistedProduct' }]
        },
        uniqueness: [['alliance', 'product']],
        checks: {}
    },
    VirtualProduct: {
        fields: {
            alliance: [{ type: 'other', other: 'Alliance' }],
            product: [{ type: 'other', other: 'ListedProduct' }],
            markup: [{ type: 'udecimal' }]
        },
        uniqueness: [['alliance', 'product']],
        checks: {}
    },
    Service: {
        fields: {
            alliance: [{ type: 'other', other: 'Alliance' }],
            name: [{ type: 'str' }]
        },
        uniqueness: [['alliance', 'name']],
        checks: {}
    },
    ServiceProvider: {
        fields: {
            service: [{ type: 'other', other: 'Service' }],
            provider: [{ type: 'other', other: 'AllianceMember' }]
        },
        uniqueness: [['service', 'provider']],
        checks: {}
    },
    AllianceMemberRequest: {
        fields: {
            alliance: [{ type: 'other', other: 'Alliance' }],
            user: [{ type: 'other', other: 'User' }]
        },
        uniqueness: [['alliance', 'user']],
        checks: {}
    },
}

// export function get_structs(): HashSet<Struct> {
//     const structs: HashSet<Struct> = HashSet.of()
//     for (let structName in schema) {
//         const struct: Struct = new Struct(structName, HashSet.of())
//         for (let fieldName in schema[structName]) {
//             const field = new Field(struct, fieldName, HashSet.of())
//             for (let variant of schema[structName][fieldName]) {
//                 field.variants.add(new FieldVariant(field, variant))
//             }
//             struct.fields.add(field)
//         }
//         structs.add(struct)
//     }
//     return structs
// }
