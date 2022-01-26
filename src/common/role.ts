import { BytesLike, ethers } from "ethers";

/**
 *
 * @internal
 */
const roleMap = {
  admin: "",
  transfer: "TRANSFER_ROLE",
  minter: "MINTER_ROLE",
  pauser: "PAUSER_ROLE",
  editor: "EDITOR_ROLE",
  lister: "LISTER_ROLE",
} as const;

export type Role = keyof typeof roleMap;

/**
 * @internal
 */
export function getRoleHash(role: Role): BytesLike {
  if (role === "admin") {
    return ethers.utils.hexZeroPad([0], 32);
  }
  return ethers.utils.id(roleMap[role]);
}
