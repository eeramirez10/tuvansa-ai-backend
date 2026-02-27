
import 'dotenv/config'
import { get } from "env-var";


export class Envs {


  public static readonly instance = new Envs()

  public readonly databaseUrl: string;
  public readonly port:number

  constructor() {

    this.databaseUrl = get('DATABASE_URL').required().asString();
    this.port = get('PORT').asPortNumber() ?? 3000
  }




}

export const envs = Envs.instance