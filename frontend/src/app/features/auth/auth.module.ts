import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { AuthRoutingModule } from './auth-routing.module';

import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';

@NgModule({
  imports: [
    SharedModule,
    AuthRoutingModule,
    LoginComponent,
    SignupComponent
  ]
})
export class AuthModule {}